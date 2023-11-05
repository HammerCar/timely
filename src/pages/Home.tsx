import {
  AllowFunc,
  DateSelectArg,
  DateSpanApi,
  EventClickArg,
  EventDropArg,
} from "@fullcalendar/core/index.js";
import enLocale from "@fullcalendar/core/locales/en-gb";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  EventResizeDoneArg,
} from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { addDoc, collection } from "firebase/firestore";
import { useRef, useState } from "react";
import { FaCheck, FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { db } from "../firebase";

interface Time {
  id: string;
  start: Date;
  end: Date;
}

const DURATIONS = [60, 30, 15, 10, 5] as const;
const INTERVALS = {
  60: 60,
  30: 60,
  15: 60,
  10: 10,
  5: 10,
} as const;

export default function Home() {
  const calendarRef = useRef<FullCalendar>(null);

  const [times, setTimes] = useState<Time[]>([]);
  const [slotDuration, setSlotDuration] =
    useState<(typeof DURATIONS)[number]>(30);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSelect = (selectionInfo: DateSelectArg) => {
    const time = {
      id: new Date().getTime().toString(),
      start: selectionInfo.start,
      end: selectionInfo.end,
    };

    setTimes((slots) => [...slots, time]);

    calendarRef.current?.getApi().unselect();
  };

  const handleSelectAllow: AllowFunc = (span: DateSpanApi) => {
    return (
      (span.start.getDate() === span.end.getDate() &&
        span.start.getMonth() === span.end.getMonth() &&
        span.start.getFullYear() === span.end.getFullYear()) ||
      (span.end.getHours() === 0 &&
        span.end.getMinutes() === 0 &&
        span.end.getSeconds() === 0 &&
        span.start.getDate() + 1 === span.end.getDate() &&
        span.start.getMonth() === span.end.getMonth() &&
        span.start.getFullYear() === span.end.getFullYear())
    );
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setTimes((slots) => slots.filter((slot) => slot.id !== clickInfo.event.id));
  };

  const handleEventEdit = (dropInfo: EventDropArg | EventResizeDoneArg) => {
    const time = times.find((time) => time.id === dropInfo.event.id);
    setTimes((slots) => slots.filter((slot) => slot.id !== time?.id));

    if (dropInfo.event.start === null || dropInfo.event.end === null) return;

    const newTime = {
      id: new Date().getTime().toString(),
      start: dropInfo.event.start,
      end: dropInfo.event.end,
    };

    setTimes((slots) => [...slots, newTime]);
  };

  const handleClear = () => {
    setTimes([]);
  };

  const handleCreate = async () => {
    setSubmitting(true);

    const doc = await addDoc(collection(db, "times"), {
      times: times.map((time) => ({
        start: time.start,
        end: time.end,
      })),
    });

    setSubmitting(false);
    handleClear();

    navigate("/" + doc.id);
  };

  return (
    <div className="h-screen p-4 flex flex-col gap-4">
      <div className="flex-1">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          height="100%"
          headerToolbar={{
            start: "dayGridMonth,timeGridWeek,timeGridDay durationSelect",
            center: "title",
            end: "today prev,next",
          }}
          customButtons={{
            durationSelect: {
              text: slotDuration + "min",
              click: () => {
                const current = DURATIONS.indexOf(slotDuration);

                const next = current + 1 >= DURATIONS.length ? 0 : current + 1;
                setSlotDuration(DURATIONS[next]);
              },
            },
          }}
          nowIndicator
          weekNumbers
          firstDay={1}
          locale={enLocale}
          events={times.map((time) => ({
            id: time.id,
            start: time.start,
            end: time.end,
          }))}
          selectable
          selectMirror
          editable
          slotDuration={{
            minutes: slotDuration,
          }}
          slotLabelInterval={{
            minutes: INTERVALS[slotDuration],
          }}
          slotLabelFormat={[{ hour: "numeric", minute: "2-digit" }]}
          scrollTime="08:00:00"
          scrollTimeReset={false}
          select={handleSelect}
          selectAllow={handleSelectAllow}
          eventClick={handleEventClick}
          eventDrop={handleEventEdit}
          eventResize={handleEventEdit}
        />
      </div>
      <div className="flex justify-between">
        <Button onClick={handleClear}>
          <FaTrashAlt />
          Clear
        </Button>

        <Button
          onClick={handleCreate}
          disabled={times.length === 0}
          loading={submitting}
        >
          <FaCheck />
          Create
        </Button>
      </div>
    </div>
  );
}
