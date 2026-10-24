import { useState, type ReactNode } from "react";
import Button from "./Button";
import Dropdown from "./Dropdown";

export type AdmitCardSchedule = {
  date: string;
  endTime: string;
  startTime: string;
  subject: string;
};

type AdmitCardPrintProps = {
  className: string;
  examName: string;
  onBack: () => void;
  schedules: AdmitCardSchedule[];
  session?: string;
};

type AdmitCardIconName = "back" | "print" | "student";

const iconPaths: Record<AdmitCardIconName, ReactNode> = {
  back: <path d="m15 18-6-6 6-6" />,
  print: <><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6z" /></>,
  student: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
};

function AdmitCardIcon({ name, className = "size-4" }: { name: AdmitCardIconName; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

const students = [
  { id: "ADM-27-1042", name: "Ananya Sharma", father: "Vikas Sharma", mother: "Pooja Sharma", dob: "14 Aug 2012", section: "Class 10-A" },
  { id: "ADM-27-1048", name: "Aarav Singh", father: "Rohit Singh", mother: "Neha Singh", dob: "22 Feb 2012", section: "Class 10-A" },
  { id: "ADM-27-1051", name: "Meera Patel", father: "Nitin Patel", mother: "Kavita Patel", dob: "03 Nov 2011", section: "Class 10-A" },
];

const subjectCodes: Record<string, string> = {
  Computer: "COM",
  English: "ENG",
  Hindi: "HIN",
  Mathematics: "MAT",
  Science: "SCI",
  "Social Studies": "SST",
};

function readableDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdmitCardPrint({ className, examName, onBack, schedules, session = "2027–28" }: AdmitCardPrintProps) {
  const [studentId, setStudentId] = useState(students[0].id);
  const student = students.find((item) => item.id === studentId) ?? students[0];

  return <div className="admit-card-print-root min-h-screen bg-slate-100 pb-20">
    <div className="admit-card-print-actions sticky top-0 z-20 border-b border-slate-200 bg-white/95 p-3 max-lg:pl-16! shadow-sm backdrop-blur-xl sm:p-4">
      <div className="mx-auto flex max-w-5xl flex-row items-center gap-2">
        <div className="flex shrink-0 gap-2">
          <Button className="max-sm:size-10 max-sm:min-h-10 max-sm:rounded-xl max-sm:!p-0" aria-label="Print Admit Card" title="Print Admit Card" onClick={() => window.print()} icon={<AdmitCardIcon name="print" />}><span className="max-sm:sr-only">Print Admit Card</span></Button>
          <Button className="max-sm:size-10 max-sm:min-h-10 max-sm:rounded-xl max-sm:!p-0" aria-label="Back to Schedule" title="Back to Schedule" variant="outline" onClick={onBack} icon={<AdmitCardIcon name="back" />}><span className="max-sm:sr-only">Back to Schedule</span></Button>
        </div>
        <div className="min-w-0 flex-1 sm:ml-auto sm:w-72 sm:flex-none">
          <Dropdown
            aria-label="Select student"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            options={students.map((item) => ({ label: `${item.name} · ${item.id}`, value: item.id }))}
          />
        </div>
      </div>
    </div>

    <main className="overflow-x-auto p-3 sm:p-6">
      <article className="admit-card-print-sheet mx-auto w-full max-w-5xl border-2 border-blue-950 bg-white text-slate-950 shadow-xl">
        <div className="border-b-4 border-double border-blue-950 px-5 py-6 text-center sm:px-8">
          <div className="font-display text-2xl font-extrabold tracking-tight text-blue-950 sm:text-3xl">PAL IT HUB</div>
          <div className="mt-1 text-sm font-semibold text-slate-600">Knowledge Park, Lucknow, Uttar Pradesh</div>
          <div className="mt-1 text-xs text-slate-500">Phone: 9827142339 &nbsp;|&nbsp; admin@palithub.edu</div>
          <div className="mx-auto mt-4 w-fit rounded-md bg-blue-950 px-6 py-2 font-display text-sm font-bold uppercase tracking-widest text-white sm:px-10 sm:text-base">{examName} — Admit Card</div>
        </div>

        <div className="p-5 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-[9rem_1fr] print:grid-cols-[9rem_1fr]">
            <div className="grid min-h-44 place-items-center border-2 border-blue-950 bg-slate-50 p-3 text-center text-slate-300">
              <div><AdmitCardIcon name="student" className="mx-auto size-16" /><div className="mt-2 text-xs font-semibold text-slate-400">Student Photograph</div></div>
            </div>
            <dl className="divide-y divide-slate-200 border-y border-slate-200">
              {[
                ["Student Name", student.name],
                ["Father's Name", student.father],
                ["Mother's Name", student.mother],
                ["Admission No.", student.id],
                ["Class", className || student.section],
                ["Date of Birth", student.dob],
                ["Session", session],
              ].map(([label, value]) => <div key={label} className="grid grid-cols-[8rem_1fr] gap-3 py-2 text-xs sm:grid-cols-[10rem_1fr] sm:text-sm"><dt className="font-semibold text-slate-600">{label}</dt><dd className="font-bold text-slate-900">{value}</dd></div>)}
            </dl>
          </div>

          <section className="mt-7">
            <div className="border-b-2 border-blue-950 pb-2 font-display text-sm font-bold uppercase tracking-wide text-blue-950">Examination Schedule</div>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-2xl border-collapse text-left text-xs sm:text-sm">
                <thead className="bg-blue-950 text-white"><tr><th className="border border-blue-900 px-3 py-2.5">#</th><th className="border border-blue-900 px-3 py-2.5">Subject</th><th className="border border-blue-900 px-3 py-2.5">Code</th><th className="border border-blue-900 px-3 py-2.5">Exam Date</th><th className="border border-blue-900 px-3 py-2.5">Time</th></tr></thead>
                <tbody>{schedules.map((schedule, index) => <tr key={`${schedule.subject}-${schedule.date}`} className="even:bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2.5 text-slate-500">{index + 1}</td>
                  <td className="border border-slate-300 px-3 py-2.5 font-semibold">{schedule.subject}</td>
                  <td className="border border-slate-300 px-3 py-2.5">{subjectCodes[schedule.subject] ?? schedule.subject.slice(0, 3).toUpperCase()}</td>
                  <td className="border border-slate-300 px-3 py-2.5">{readableDate(schedule.date)}</td>
                  <td className="border border-slate-300 px-3 py-2.5">{schedule.startTime}–{schedule.endTime}</td>
                </tr>)}</tbody>
              </table>
              {!schedules.length && <div className="border border-slate-200 p-6 text-center text-sm text-slate-400">No examination papers have been scheduled for this class.</div>}
            </div>
          </section>

          <section className="mt-6 border-t border-dashed border-slate-300 pt-4">
            <div className="text-xs font-bold text-slate-900">Important Instructions</div>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-5 text-slate-600">
              <li>Students must carry this admit card to the examination hall.</li>
              <li>Students must reach the examination room at least 15 minutes before the scheduled time.</li>
              <li>Mobile phones and electronic gadgets are strictly prohibited.</li>
              <li>Any form of malpractice will lead to immediate disqualification.</li>
            </ol>
          </section>

          <div className="mt-16 grid grid-cols-2 gap-16 text-center text-xs font-semibold">
            <div className="border-t border-slate-700 pt-2">Class Teacher</div>
            <div className="border-t border-slate-700 pt-2">Principal</div>
          </div>
          <div className="mt-8 text-center text-xs italic text-slate-400">Computer Generated Admit Card</div>
        </div>
      </article>
    </main>
  </div>;
}
