import StartPage from "@/app/start/page";

export const metadata = {
  title: "Default · eDebatte",
};

export default async function DefaultPage() {
  return (
    <>
      <h1 className="sr-only">Default</h1>
      <StartPage />
    </>
  );
}
