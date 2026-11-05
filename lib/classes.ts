type ClassConditions = { [name: string]: ClassValue };
export type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | ClassValue[]
  | ClassConditions;

// Keep caller order, including repeated names. StyleX resolves its own conflicts.
export function joinClassValues(inputs: ClassValue[]): string {
  let classes = "";
  for (const input of inputs) {
    if (!input || input === true) continue;
    let group = "";
    if (Array.isArray(input)) {
      group = joinClassValues(input);
    } else {
      const constructor = input.constructor;
      if (constructor === String || constructor === Number) {
        group = String(input);
      } else if (constructor !== BigInt) {
        // SAFETY: The typed union's falsy values, booleans, bigint, strings, numbers and arrays were handled above.
        const conditions = input as ClassConditions;
        for (const name in conditions) {
          if (conditions[name]) group += group ? ` ${name}` : name;
        }
      }
    }
    if (group) {
      classes += classes ? ` ${group}` : group;
    }
  }
  return classes;
}

export function joinClasses(...inputs: ClassValue[]): string {
  return joinClassValues(inputs);
}
