'use client';

import { useMemo, useState } from 'react';
import { commitProgressionImport } from '@/lib/import/commit';
import { parseCsv, validateProgressionRows } from '@/lib/import/csv';

const REQUIRED_COLUMNS = [
  'program_block_name',
  'week',
  'day',
  'exercise_name',
  'target_sets',
  'target_reps',
  'target_load',
  'target_rpe',
  'notes',
];

export function ImportWizard({ userId }: { userId: string }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<'exercises' | 'program'>('program');
  const [rawCsv, setRawCsv] = useState('');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [allowCreate, setAllowCreate] = useState(true);
  const [result, setResult] = useState<string>('');

  const parsed = useMemo(() => parseCsv(rawCsv), [rawCsv]);

  const mappedRows = useMemo(() => {
    if (parsed.rows.length === 0) {
      return [];
    }

    return parsed.rows.map((row) => {
      const next: Record<string, string> = {};
      REQUIRED_COLUMNS.forEach((col) => {
        const source = mapping[col] ?? col;
        next[col] = row[source] ?? '';
      });
      return next;
    });
  }, [mapping, parsed.rows]);

  const validation = useMemo(() => validateProgressionRows(mappedRows), [mappedRows]);

  return (
    <div className="card">
      <h2>Wizard importazione CSV</h2>
      <p>Step {step} di 5</p>

      {step === 1 && (
        <div>
          <label>
            Tipo importazione
            <select value={type} onChange={(event) => setType(event.target.value as 'exercises' | 'program')}>
              <option value="program">Programma + Progressioni</option>
              <option value="exercises">Solo esercizi (non implementato in questo task)</option>
            </select>
          </label>
          <button onClick={() => setStep(2)}>Continua</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <label htmlFor="csvUpload">Carica CSV</label>
          <input
            id="csvUpload"
            type="file"
            accept=".csv,text/csv"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              setRawCsv(text);
            }}
          />
          <button onClick={() => setStep(3)} disabled={!rawCsv}>
            Continua
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <p>Mappatura colonne</p>
          {REQUIRED_COLUMNS.map((col) => (
            <label key={col}>
              {col}
              <select
                value={mapping[col] ?? col}
                onChange={(event) => setMapping((prev) => ({ ...prev, [col]: event.target.value }))}
              >
                {parsed.headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button onClick={() => setStep(4)}>Valida</button>
        </div>
      )}

      {step === 4 && (
        <div>
          <p>Anteprima righe valide: {validation.validRows.length}</p>
          <label>
            <input
              type="checkbox"
              checked={allowCreate}
              onChange={(event) => setAllowCreate(event.target.checked)}
            />
            Crea automaticamente esercizi mancanti
          </label>
          {validation.issues.length > 0 && (
            <ul>
              {validation.issues.map((issue, index) => (
                <li key={`${issue.row}-${index}`}>
                  Riga {issue.row}: {issue.message}
                </li>
              ))}
            </ul>
          )}
          <div className="tableWrap">
            <table className="progressionTable">
              <thead>
                <tr>
                  {REQUIRED_COLUMNS.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mappedRows.slice(0, 10).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {REQUIRED_COLUMNS.map((col) => (
                      <td key={col}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => setStep(5)} disabled={validation.validRows.length === 0}>
            Vai al commit
          </button>
        </div>
      )}

      {step === 5 && (
        <div>
          <p>Conferma importazione di {validation.validRows.length} righe.</p>
          <button
            onClick={async () => {
              const summary = await commitProgressionImport({
                userId,
                rows: validation.validRows,
                createMissingExercises: allowCreate,
              });
              setResult(
                `Import completato. Blocchi creati: ${summary.createdBlocks}, esercizi creati: ${summary.createdExercises}, righe create: ${summary.createdRows}`,
              );
            }}
          >
            Esegui import
          </button>
          {result && <p>{result}</p>}
          {typeof navigator !== 'undefined' && !navigator.onLine && (
            <p>Offline: dati salvati in locale e in coda per la sincronizzazione.</p>
          )}
        </div>
      )}
    </div>
  );
}
