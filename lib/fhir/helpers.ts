export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function calculateAge(birthDate: string, asOf = new Date("2026-05-02T12:00:00")) {
  const birth = new Date(`${birthDate}T12:00:00`);
  let age = asOf.getFullYear() - birth.getFullYear();
  const monthDelta = asOf.getMonth() - birth.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && asOf.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}
