import { useState } from "react";
import Header from "../../ui/header";
import { Button, Dropdown, Input, useToast } from "../../components";

export type MenuScreenConfig = {
  title: string;
  subtitle: string;
  action: string;
  stats?: { label: string; value: string; tone?: string }[];
  fields?: string[];
  columns: string[];
  rows?: string[][];
  empty?: string;
};

type MenuScreenProps = {
  config: MenuScreenConfig;
  onAction?: () => void;
  rows?: string[][];
};

export default function MenuScreen({ config, onAction, rows }: MenuScreenProps) {
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const displayRows = rows ?? config.rows ?? [];

  const save = async () => {
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setSaving(false);
    showToast(`${config.title} information has been saved and is ready to use.`, { title: `${config.title} saved` });
  };

  return <div className="min-h-screen dashboard-bg pb-16">
    <Header title={config.title} subtitle={config.subtitle} action={config.action} onAction={onAction} />
    <main className="space-y-5 p-4 sm:p-6 xl:p-8">
      {config.stats && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {config.stats.map((stat) => <article key={stat.label} className={`module-stat module-stat-${stat.tone ?? "teal"}`}><div className="text-xs text-slate-500">{stat.label}</div><div className="mt-1 text-xl font-bold text-slate-950">{stat.value}</div></article>)}
      </div>}

      {config.fields && <section className="panel">
        <div className="panel-title"><h2>{config.action}</h2></div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {config.fields.map((field) => <Input key={field} label={field} placeholder={`Enter ${field.toLowerCase()}`} />)}
        </div>
        <div className="border-t border-slate-100 p-4"><Button onClick={save} isLoading={saving} loadingText="Saving...">{config.action}</Button></div>
      </section>}

      <section className="panel">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-3 sm:flex-row">
          <Input className="sm:min-w-64" placeholder={`Search ${config.title.toLowerCase()}...`} aria-label={`Search ${config.title}`} />
          <Dropdown className="sm:w-44" aria-label="Status" placeholder="All Status" options={[{ label: "Active", value: "active" }, { label: "Pending", value: "pending" }, { label: "Inactive", value: "inactive" }]} />
          <Button>Filter</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="module-table">
            <thead><tr>{config.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>{displayRows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} data-label={config.columns[cellIndex]}>{cell}</td>)}</tr>)}</tbody>
          </table>
          {!displayRows.length && <div className="grid min-h-52 place-items-center p-6 text-center text-sm text-slate-400">{config.empty ?? `No ${config.title.toLowerCase()} records found`}</div>}
        </div>
      </section>
    </main>
  </div>;
}
