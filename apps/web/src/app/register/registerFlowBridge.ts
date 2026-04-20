export type RegisterFlowBridge = {
  title: string;
  text: string;
};

export function resolveRegisterBridge(next: string | null): RegisterFlowBridge | null {
  if (!next) return null;
  const path = next.split("?")[0] || next;

  if (path.startsWith("/create")) {
    return {
      title: "Willkommen bei eDebatte",
      text: "Du kommst aus dem Eingabe-Flow. Mit einem Konto können wir deine Eingabe sicher speichern und danach direkt weiterführen.",
    };
  }
  if (path.startsWith("/mitglied-antrag") || path.startsWith("/mitglied-werden")) {
    return {
      title: "Willkommen bei eDebatte",
      text: "Du kommst aus dem Mitgliedschafts-Flow. Nach der Registrierung führen wir dich ohne Umweg zurück in den Antrag.",
    };
  }
  if (path.startsWith("/stream")) {
    return {
      title: "Willkommen bei eDebatte",
      text: "Du kommst aus dem Stream-Kontext. Für Beteiligung und Zuordnung ist ein Konto erforderlich.",
    };
  }
  if (path.startsWith("/order") || path.startsWith("/vormerken") || path.startsWith("/pricing")) {
    return {
      title: "Willkommen bei eDebatte",
      text: "Du kommst aus dem Pricing/Order-Flow. Mit Registrierung können wir deine Angaben weiterbearbeiten.",
    };
  }
  return {
    title: "Willkommen bei eDebatte",
    text: "Damit wir deine Eingabe sicher weiterbearbeiten können, melde dich bitte an oder registriere dich.",
  };
}
