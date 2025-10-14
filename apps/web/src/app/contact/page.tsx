// src/app/contact/page.tsx

export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <h1 className="text-3xl font-bold text-coral text-center">Kontakt</h1>

      <p className="text-gray-700 text-center text-lg">
        Du hast Fragen, Hinweise oder möchtest uns etwas mitteilen? Schreib uns
        jederzeit eine Nachricht.
      </p>

      <form
        className="space-y-6"
        action="mailto:team@voiceopengov.org"
        method="POST"
        encType="text/plain"
      >
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Dein Name
          </label>
          <input
            name="name"
            type="text"
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            E-Mail-Adresse
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Nachricht
          </label>
          <textarea
            name="message"
            rows={5}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <button
          type="submit"
          className="bg-coral text-white px-6 py-3 rounded font-semibold hover:opacity-90 transition"
        >
          Nachricht senden
        </button>
      </form>
    </main>
  );
}
