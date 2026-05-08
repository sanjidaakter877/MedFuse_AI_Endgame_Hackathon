"use client";

import { useState } from "react";

const PATIENTS = ["Maya Hernandez", "Jordan Lee", "Avery Chen"];

type PatientSearchProps = {
  onRun: (query: string) => void;
  isRunning: boolean;
};

export function PatientSearch({ onRun, isRunning }: PatientSearchProps) {
  const [selected, setSelected] = useState(PATIENTS[0]);

  return (
    <form
      className="patient-search"
      onSubmit={(e) => {
        e.preventDefault();
        onRun(selected);
      }}
    >
      <label>
        Search patient
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={isRunning}
        >
          {PATIENTS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <button className="primary-action" type="submit" disabled={isRunning}>
        {isRunning ? "Running" : "Run Review"}
      </button>
    </form>
  );
}
