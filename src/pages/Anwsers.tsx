import clsx from "clsx";
import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FaCheck, FaQuestion, FaTimes } from "react-icons/fa";
import { useParams } from "react-router-dom";
import Button from "../components/Button";
import { db } from "../firebase";
import useDoc from "../hooks/useDoc";

type FirebaseDate = {
  seconds: number;
  nanoseconds: number;
};

interface TimeDoc {
  times: {
    start: FirebaseDate;
    end: FirebaseDate;
  }[];
  responses?: { [name: string]: Anwser[] };
}

interface Anwser {
  start: FirebaseDate;
  end: FirebaseDate;
  value: "yes" | "no" | "maybe";
}

interface LocalAnwser {
  id: number;
  start: Date;
  end: Date;
  value: "yes" | "no" | "maybe";
}

export default function Anwsers() {
  const params = useParams();
  const id = params.id;

  const { data } = useDoc<TimeDoc>(`times/${id}`);

  if (id === undefined) {
    return "No id";
  }

  return (
    <div className="p-4">
      <div className="flex flex-col gap-2 overflow-x-auto pb-2">
        <div className="flex flex-col">
          <TitleRow id={id} />
          <InputRow id={id} />
        </div>
        <div className="flex flex-col">
          {data?.responses &&
            Object.entries(data.responses).map(([name, anwsers]) => (
              <AnwserRow key={name} name={name} anwsers={anwsers} />
            ))}
        </div>
        <TotalRow id={id} />
      </div>
    </div>
  );
}

interface TitleRowProps {
  id: string;
}

function TitleRow(props: TitleRowProps) {
  const { id } = props;

  const { data } = useDoc<TimeDoc>(`times/${id}`);

  const timesByDays = data?.times?.reduce((acc, time) => {
    const start = new Date(time.start.seconds * 1000);
    const end = new Date(time.end.seconds * 1000);

    const day = `${start.getDate()}.${start.getMonth()}.${start.getFullYear()}`;

    if (acc[day] === undefined) {
      acc[day] = [];
    }

    acc[day].push({ start, end });

    return acc;
  }, {} as { [key: string]: { start: Date; end: Date }[] });

  return (
    <div className="flex gap-2 pb-1">
      <div className="w-40 flex flex-shrink-0 items-end">Name:</div>
      <div className="flex items-center">
        {timesByDays &&
          Object.entries(timesByDays).map(([day, times], index, array) => {
            const isLast = array.length - 1 === index;

            return (
              <div
                key={day}
                className={clsx(
                  "flex flex-col items-center",
                  !isLast && "border-r pr-px"
                )}
              >
                <div className="w-20 text-center">{day}</div>
                <div className="flex gap-0.5">
                  {times.map((time, index) => {
                    return (
                      <div
                        key={index}
                        className="w-20 flex justify-center text-xs"
                      >
                        {time.start.getHours()}:
                        {("0" + time.start.getMinutes().toString()).slice(-2)}-
                        {time.end.getHours()}:
                        {("0" + time.end.getMinutes().toString()).slice(-2)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

interface InputRowProps {
  id: string;
}

function InputRow(props: InputRowProps) {
  const { id } = props;

  const { data } = useDoc<TimeDoc>(`times/${id}`);

  const [times, setTimes] = useState<LocalAnwser[]>([]);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (data === undefined) {
      return;
    }

    setTimes(
      data.times.map((time, index) => ({
        id: index,
        start: new Date(time.start.seconds * 1000),
        end: new Date(time.end.seconds * 1000),
        value: "no",
      }))
    );
  }, [data]);

  const handleSubmit = async () => {
    if (name === "") {
      alert("Name cannot be empty");
      return;
    }

    const isSure = confirm("Are you sure you want to submit?");
    if (!isSure) {
      return;
    }

    const data = {} as { [key: string]: object };
    data[`responses.${name}`] = times.map((time) => ({
      start: time.start,
      end: time.end,
      value: time.value,
    }));

    await updateDoc(doc(db, "times", id), data);

    window.location.reload();
  };

  return (
    <div className="flex gap-2">
      <div className="w-40 flex flex-shrink-0 items-center gap-1">
        <input
          type="text"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-1 w-full"
          onChange={(e) => setName(e.target.value)}
        />
        <Button size="icon" onClick={handleSubmit}>
          <FaCheck />
        </Button>
      </div>
      <div className="flex gap-0.5">
        {times.map((time) => (
          <AnwserButton
            key={time.id}
            value={time.value}
            onClick={() => {
              setTimes((times) =>
                times.map((t) =>
                  t.id === time.id
                    ? {
                        ...t,
                        value:
                          t.value === "yes"
                            ? "maybe"
                            : t.value === "maybe"
                            ? "no"
                            : "yes",
                      }
                    : t
                )
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface AnwserRowProps {
  name: string;
  anwsers: Anwser[];
}

function AnwserRow(props: AnwserRowProps) {
  const { name, anwsers } = props;

  return (
    <div className="flex gap-2 pb-1">
      <div className="w-40 flex flex-shrink-0 items-center justify-end">
        {name}
      </div>
      <div className="flex gap-0.5 items-center">
        {anwsers.map((anwser, index) => {
          return (
            <div key={index} className="flex flex-col items-center">
              <AnwserButton value={anwser.value} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TotalRowProps {
  id: string;
}

function TotalRow(props: TotalRowProps) {
  const { id } = props;

  const { data } = useDoc<TimeDoc>(`times/${id}`);

  const timeTotals =
    data?.responses &&
    Object.entries(data.responses).reduce((acc, [, anwsers]) => {
      anwsers.forEach((anwser) => {
        const start = new Date(anwser.start.seconds * 1000);
        const end = new Date(anwser.end.seconds * 1000);

        let time = acc.find(
          (time) =>
            time.start.getTime() === start.getTime() &&
            time.end.getTime() === end.getTime()
        );

        if (time === undefined) {
          time = {
            start,
            end,
            yes: 0,
            no: 0,
            maybe: 0,
          };

          acc.push(time);
        }

        if (anwser.value === "yes") {
          time.yes++;
        } else if (anwser.value === "no") {
          time.no++;
        } else if (anwser.value === "maybe") {
          time.maybe++;
        }
      });

      return acc;
    }, [] as { start: Date; end: Date; yes: number; no: number; maybe: number }[]);

  return (
    <div className="flex gap-2 pb-1">
      <div className="w-40 flex flex-shrink-0 items-center justify-end">
        Total
      </div>
      <div className="flex gap-0.5 items-center">
        {timeTotals?.map((time, index) => {
          const percentage =
            (time.yes + time.maybe / 2) / (time.yes + time.no + time.maybe);

          const lerp = (start: number, end: number, t: number) => {
            return (1 - t) * start + t * end;
          };

          const r =
            percentage < 0.5
              ? lerp(239, 234, percentage)
              : lerp(234, 34, percentage);
          const g =
            percentage < 0.5
              ? lerp(68, 179, percentage)
              : lerp(179, 197, percentage);
          const b =
            percentage < 0.5
              ? lerp(68, 8, percentage)
              : lerp(8, 94, percentage);

          return (
            <div
              key={index}
              className={clsx(
                "w-20 flex justify-center",
                "text-white font-bold py-1 w-20 flex justify-center rounded"
              )}
              style={{
                backgroundColor: `rgb(${r},${g},${b})`,
              }}
            >
              {time.yes}
              {time.maybe > 0 && `+${time.maybe}`}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AnwserButtonProps {
  value: "yes" | "no" | "maybe";
  onClick?: () => void;
}

function AnwserButton(props: AnwserButtonProps) {
  const { value, onClick } = props;

  return (
    <button
      className={clsx(
        "text-white font-bold py-2 w-20 flex justify-center rounded",
        value === "yes" && "bg-green-500",
        value === "yes" && onClick && "hover:bg-green-700",
        value === "no" && "bg-red-500",
        value === "no" && onClick && "hover:bg-red-700",
        value === "maybe" && "bg-yellow-500",
        value === "maybe" && onClick && "hover:bg-yellow-700",
        !onClick && "cursor-default"
      )}
      onClick={onClick}
    >
      {(value === "yes" && <FaCheck />) ||
        (value === "no" && <FaTimes />) ||
        (value === "maybe" && <FaQuestion />)}
    </button>
  );
}
