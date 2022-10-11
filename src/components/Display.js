function Display({
  text,
  position
}) {
  return (
    <div>
      <div>Position: {position}</div>
      <div>{text}</div>
    </div>
  );
}

export default Display;