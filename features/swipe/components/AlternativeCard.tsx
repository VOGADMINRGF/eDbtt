import { useState } from "react";
import { Button } from "@ui";

export default function AlternativeCard({ alternative }) {
  const [votes, setVotes] = useState(alternative.votes);

  const voteHandler = (type) => setVotes(prev => ({ ...prev, [type]: prev[type] + 1 }));

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 my-2">
      <h5>{alternative.option}</h5>
      <p>{alternative.impact}</p>
      <div className="flex gap-2 mt-2">
        <Button small onClick={() => voteHandler('agree')}>👍 {votes.agree}</Button>
        <Button small onClick={() => voteHandler('neutral')}>🤔 {votes.neutral}</Button>
        <Button small onClick={() => voteHandler('disagree')}>👎 {votes.disagree}</Button>
      </div>
    </div>
  );
}
