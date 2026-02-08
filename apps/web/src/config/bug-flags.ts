export function isBugEnabled(flag: string): boolean {
  return (
    import.meta.env.VITE_BUGS === "on" && import.meta.env[flag] === "1"
  );
}
