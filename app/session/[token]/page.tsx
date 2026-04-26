import { SessionClient } from "./sessionClient";

export default async function SessionPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  return <SessionClient token={token} />;
}
