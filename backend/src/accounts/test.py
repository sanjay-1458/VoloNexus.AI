from __future__ import annotations

import json
import os
from datetime import date, datetime, time, timedelta
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI


load_dotenv()

TIMEZONE = ZoneInfo(os.getenv("AGENT_TIMEZONE", "Asia/Kolkata"))
DATABASE = Path(__file__).with_name("meetings.json")
WORK_START = time(9, 0)
WORK_END = time(18, 0)
SLOT_INTERVAL = timedelta(minutes=30)


def load_meetings() -> list[dict]:
    if not DATABASE.exists():
        return []
    with DATABASE.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_meetings(meetings: list[dict]) -> None:
    with DATABASE.open("w", encoding="utf-8") as file:
        json.dump(meetings, file, indent=2)


def meeting_interval(day: str, start_time: str, duration_minutes: int) -> tuple[datetime, datetime]:
    if not 15 <= duration_minutes <= 240:
        raise ValueError("Duration must be between 15 and 240 minutes")

    start = datetime.strptime(f"{day} {start_time}", "%Y-%m-%d %H:%M").replace(tzinfo=TIMEZONE)
    end = start + timedelta(minutes=duration_minutes)

    if start.time() < WORK_START or end.time() > WORK_END or end.date() != start.date():
        raise ValueError("Meetings must fit within working hours, 09:00 to 18:00")

    if start <= datetime.now(TIMEZONE):
        raise ValueError("Meetings cannot start in the past")

    return start, end


def get_conflicts(
    meetings: list[dict], start: datetime, end: datetime, exclude_id: str | None = None
) -> list[dict]:
    return [
        meeting
        for meeting in meetings
        if meeting["id"] != exclude_id
        and start < datetime.fromisoformat(meeting["end"])
        and end > datetime.fromisoformat(meeting["start"])
    ]


@tool(description="Get the current date, local time, and time zone before handling relative dates.")
def current_datetime() -> str:
    return datetime.now(TIMEZONE).isoformat(timespec="minutes")


@tool(description="List calendar meetings. Provide a YYYY-MM-DD day or 'all' to list every meeting.")
def list_meetings(day: str = "all") -> str:
    meetings = load_meetings()
    if day != "all":
        try:
            date.fromisoformat(day)
        except ValueError:
            return "Invalid date. Use YYYY-MM-DD."
        meetings = [meeting for meeting in meetings if meeting["start"][:10] == day]

    meetings.sort(key=lambda meeting: meeting["start"])
    return json.dumps(meetings)


@tool(description="Find available working-hour meeting slots on a YYYY-MM-DD date without overlapping existing meetings.")
def find_free_slots(day: str, duration_minutes: int = 30, limit: int = 5) -> str:
    try:
        chosen_day = date.fromisoformat(day)
        if not 15 <= duration_minutes <= 240:
            raise ValueError("Duration must be between 15 and 240 minutes")
    except ValueError as error:
        return str(error)

    meetings = load_meetings()
    cursor = datetime.combine(chosen_day, WORK_START, tzinfo=TIMEZONE)
    closing = datetime.combine(chosen_day, WORK_END, tzinfo=TIMEZONE)
    duration = timedelta(minutes=duration_minutes)
    slots = []

    while cursor + duration <= closing and len(slots) < max(1, min(limit, 20)):
        end = cursor + duration
        if cursor > datetime.now(TIMEZONE) and not get_conflicts(meetings, cursor, end):
            slots.append({"start": cursor.isoformat(), "end": end.isoformat()})
        cursor += SLOT_INTERVAL

    return json.dumps(slots)


@tool(description="Book a meeting with a title, YYYY-MM-DD date, HH:MM start time, duration in minutes, and priority. Reject overlapping meetings.")
def schedule_meeting(
    title: str, day: str, start_time: str, duration_minutes: int = 30, priority: str = "normal"
) -> str:
    if not title.strip():
        return "A meeting title is required."

    if priority not in {"low", "normal", "high"}:
        return "Priority must be low, normal, or high."

    try:
        start, end = meeting_interval(day, start_time, duration_minutes)
    except ValueError as error:
        return str(error)

    meetings = load_meetings()
    conflicts = get_conflicts(meetings, start, end)
    if conflicts:
        return json.dumps({"status": "conflict", "meetings": conflicts, "next_step": "find_free_slots"})

    meeting = {
        "id": uuid4().hex[:12],
        "title": title.strip(),
        "start": start.isoformat(),
        "end": end.isoformat(),
        "priority": priority,
    }
    meetings.append(meeting)
    save_meetings(meetings)
    return json.dumps({"status": "scheduled", "meeting": meeting})


@tool(description="Reschedule an existing meeting by ID to a new YYYY-MM-DD date and HH:MM start time, preserving its original duration.")
def reschedule_meeting(meeting_id: str, day: str, start_time: str) -> str:
    meetings = load_meetings()
    meeting = next((item for item in meetings if item["id"] == meeting_id), None)
    if meeting is None:
        return "Meeting not found."

    duration = int(
        (datetime.fromisoformat(meeting["end"]) - datetime.fromisoformat(meeting["start"])).total_seconds()
        // 60
    )

    try:
        start, end = meeting_interval(day, start_time, duration)
    except ValueError as error:
        return str(error)

    conflicts = get_conflicts(meetings, start, end, exclude_id=meeting_id)
    if conflicts:
        return json.dumps({"status": "conflict", "meetings": conflicts, "next_step": "find_free_slots"})

    meeting["start"] = start.isoformat()
    meeting["end"] = end.isoformat()
    save_meetings(meetings)
    return json.dumps({"status": "rescheduled", "meeting": meeting})


@tool(description="Cancel a calendar meeting by its meeting ID.")
def cancel_meeting(meeting_id: str) -> str:
    meetings = load_meetings()
    remaining = [meeting for meeting in meetings if meeting["id"] != meeting_id]
    if len(remaining) == len(meetings):
        return "Meeting not found."

    save_meetings(remaining)
    return json.dumps({"status": "cancelled", "meeting_id": meeting_id})


def build_agent():
    model = ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        temperature=0,
        timeout=30,
        max_retries=2,
    )
    return create_agent(
        model=model,
        tools=[
            current_datetime,
            list_meetings,
            find_free_slots,
            schedule_meeting,
            reschedule_meeting,
            cancel_meeting,
        ],
        system_prompt=(
            "You are an AI calendar scheduling agent. "
            f"The user's timezone is {TIMEZONE.key} and working hours are 09:00-18:00. "
            "Use tools for all calendar operations. "
            "Check the current date when handling relative dates. "
            "Never invent meeting IDs or claim that a tool action succeeded when it failed. "
            "When a slot is occupied, offer free alternatives. "
            "Ask for missing information instead of guessing. "
            "Keep responses concise and clear."
        ),
    )


def main() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit("Set OPENAI_API_KEY in your environment or .env file")

    agent = build_agent()
    messages = []
    print("AI Calendar Agent | type 'exit' to quit")

    while True:
        try:
            prompt = input("\nYou: ").strip()
        except (KeyboardInterrupt, EOFError):
            break

        if prompt.lower() in {"exit", "quit"}:
            break
        if not prompt:
            continue

        messages.append({"role": "user", "content": prompt})
        try:
            result = agent.invoke({"messages": messages}, config={"recursion_limit": 20})
        except Exception as error:
            messages.pop()
            print(f"\nError: {error}")
            continue

        messages = result["messages"]
        print(f"\nAgent: {messages[-1].content}")


if __name__ == "__main__":
    main()
