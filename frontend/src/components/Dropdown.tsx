import type { SelectHTMLAttributes } from "react";

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: DropdownOption[];
  placeholder?: string;
};

export default function Dropdown({ className = "", id, label, options, placeholder = "Select an option", ...props }: DropdownProps) {
  return <label htmlFor={id} className="block">
    {label && <span className="form-label">{label}</span>}
    <select id={id} className={`form-input appearance-none bg-white ${className}`} {...props}>
      <option value="">{placeholder}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}
