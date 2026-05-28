"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

const reportTypes = [
  "Szolgálati jelentés",
  "Panasz / bejelentés",
  "Incidens jelentés",
  "Jármű / felszerelés kérelem",
  "Egyéb",
];

const priorities = ["Alacsony", "Normál", "Magas", "Sürgős"];

const checklist = [
  {
    title: "Rendezett adatok",
    text: "A beküldés előtt minden fontos mező egységes formátumban kerül összegyűjtésre.",
  },
  {
    title: "Képes bizonyíték",
    text: "Legfeljebb 5 kép csatolható, a rendszer ezeket Discord mellékletként továbbítja.",
  },
  {
    title: "Discord webhook",
    text: "A jelentés szerveroldalról megy ki, így a webhook URL nem kerül a böngészőbe.",
  },
  {
    title: "Mobilbarát felület",
    text: "A forma telefonról és asztali gépről is gyorsan kitölthető.",
  },
];

type SubmitState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });

  const fileSummary = useMemo(
    () =>
      selectedFiles.map((file) => ({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      })),
    [selectedFiles],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = new FormData(form);

    setSubmitState({
      status: "loading",
      message: "Jelentés küldése folyamatban...",
    });

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        body: payload,
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Nem sikerült elküldeni a jelentést.");
      }

      setSubmitState({
        status: "success",
        message:
          result?.message ??
          "A jelentés sikeresen megérkezett a kijelölt Discord csatornába.",
      });
      form.reset();
      setSelectedFiles([]);
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Váratlan hiba történt a jelentés küldése közben.",
      });
    }
  }

  function resetForm() {
    formRef.current?.reset();
    setSelectedFiles([]);
    setSubmitState({ status: "idle", message: "" });
  }

  return (
    <main className="page-shell">
      <header className="topbar" aria-label="Oldal fejléc">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            DH
          </span>
          <span>Dawn Honvedseg</span>
        </div>
        <div className="discord-pill">
          <span className="status-dot" aria-hidden="true" />
          Discord integrációra előkészítve
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Jelentésíró központ</p>
          <h1>Gyors, tiszta és követhető jelentés beküldés.</h1>
          <p className="hero-lead">
            Töltsd ki az űrlapot, adj meg minden fontos részletet, csatold a
            bizonyítékokat, és a rendszer egy formázott Discord üzenetben
            továbbítja a jelentést a megfelelő csatornába.
          </p>

          <div className="summary-grid" aria-label="Fő funkciók">
            {checklist.map((item) => (
              <article className="summary-card" key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </article>
            ))}
          </div>
        </div>

        <section className="report-panel" aria-labelledby="report-form-title">
          <div className="panel-head">
            <div>
              <h2 id="report-form-title">Új jelentés</h2>
              <p>
                A csillaggal jelölt mezők kötelezőek. A képek JPG, PNG, WEBP
                vagy GIF formátumban tölthetők fel.
              </p>
            </div>
            <span className="secure-badge">Szerveroldali küldés</span>
          </div>

          <form ref={formRef} className="report-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="reporterName">Jelentő neve *</label>
                <input
                  id="reporterName"
                  name="reporterName"
                  autoComplete="name"
                  placeholder="Pl. Kovács Péter"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="discordName">Discord név *</label>
                <input
                  id="discordName"
                  name="discordName"
                  placeholder="Pl. peter#1234 vagy @peter"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="reportType">Jelentés típusa *</label>
                <select id="reportType" name="reportType" defaultValue="" required>
                  <option value="" disabled>
                    Válassz típust
                  </option>
                  {reportTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="priority">Prioritás *</label>
                <select id="priority" name="priority" defaultValue="Normál" required>
                  {priorities.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="subjectName">Érintett személy / egység</label>
                <input
                  id="subjectName"
                  name="subjectName"
                  placeholder="Név, rang vagy egység"
                />
              </div>

              <div className="field">
                <label htmlFor="location">Helyszín</label>
                <input id="location" name="location" placeholder="Pl. város, bázis, koordináta" />
              </div>

              <div className="field">
                <label htmlFor="incidentDate">Esemény ideje *</label>
                <input id="incidentDate" name="incidentDate" type="datetime-local" required />
              </div>

              <div className="field">
                <label htmlFor="contact">Elérhetőség</label>
                <input id="contact" name="contact" placeholder="Discord ID, e-mail vagy telefon" />
              </div>

              <div className="field field-wide">
                <label htmlFor="summary">Rövid tárgy *</label>
                <input
                  id="summary"
                  name="summary"
                  maxLength={140}
                  placeholder="Egy mondatban a jelentés lényege"
                  required
                />
                <small>Maximum 140 karakter, ez lesz a Discord üzenet címe.</small>
              </div>

              <div className="field field-wide">
                <label htmlFor="description">Részletes leírás *</label>
                <textarea
                  id="description"
                  name="description"
                  minLength={20}
                  placeholder="Írd le időrendben, mi történt, kik voltak érintettek, és milyen intézkedés történt."
                  required
                />
              </div>

              <div className="field field-wide">
                <label htmlFor="evidenceLinks">Külső bizonyíték linkek</label>
                <textarea
                  id="evidenceLinks"
                  name="evidenceLinks"
                  placeholder="Drive, YouTube, Medal, Streamable vagy egyéb linkek, soronként egy."
                />
              </div>

              <div className="field field-wide">
                <label htmlFor="reportFiles">Képek csatolása</label>
                <div className="dropzone">
                  <div>
                    <strong>Húzd ide vagy válaszd ki a képeket</strong>
                    <p className="field-hint">
                      Maximum 5 kép, képenként legfeljebb 8 MB.
                    </p>
                    <input
                      id="reportFiles"
                      name="reportFiles"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      multiple
                      onChange={(event) =>
                        setSelectedFiles(Array.from(event.target.files ?? []))
                      }
                    />
                  </div>
                </div>
                {fileSummary.length > 0 ? (
                  <ul className="selected-files" aria-label="Kiválasztott fájlok">
                    {fileSummary.map((file) => (
                      <li key={`${file.name}-${file.size}`}>
                        {file.name} ({file.size})
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            {submitState.message ? (
              <p
                className={`message ${
                  submitState.status === "error" ? "message-error" : "message-success"
                }`}
                role={submitState.status === "error" ? "alert" : "status"}
              >
                {submitState.message}
              </p>
            ) : null}

            <div className="actions">
              <button
                className="submit-button"
                type="submit"
                disabled={submitState.status === "loading"}
              >
                {submitState.status === "loading"
                  ? "Küldés..."
                  : "Jelentés küldése Discordra"}
              </button>
              <button className="clear-button" type="button" onClick={resetForm}>
                Űrlap törlése
              </button>
            </div>

            <p className="privacy-note">
              A webhook URL csak a szerveren használt környezeti változóban él.
              Élesítéshez állítsd be a DISCORD_WEBHOOK_URL értékét a hosting
              környezetben.
            </p>
          </form>
        </section>
      </section>
    </main>
  );
}
