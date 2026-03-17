import RegisterPage, { metadata } from "../register/page";

export { metadata };

export default function RegistAliasPage() {
  return (
    <>
      <h1 className="sr-only">Registrierung</h1>
      <RegisterPage />
    </>
  );
}
