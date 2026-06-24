export function normalizeCustomerClassName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function parseCustomerClasses(value: string) {
  return value
    .split(",")
    .map(normalizeCustomerClassName)
    .filter(Boolean)
    .filter((item, index, items) => {
      const normalised = item.toLowerCase();
      return items.findIndex((candidate) => candidate.toLowerCase() === normalised) === index;
    });
}

export function addCustomerClass(classes: string[], value: string) {
  const nextClass = normalizeCustomerClassName(value);

  if (!nextClass) {
    return classes;
  }

  if (classes.some((customerClass) => customerClass.toLowerCase() === nextClass.toLowerCase())) {
    return classes;
  }

  return [...classes, nextClass];
}

export function renameCustomerClass(classes: string[], currentName: string, nextName: string) {
  const nextClass = normalizeCustomerClassName(nextName);

  if (!nextClass) {
    return classes;
  }

  const currentNormalised = currentName.toLowerCase();
  const duplicate = classes.some(
    (customerClass) =>
      customerClass.toLowerCase() !== currentNormalised &&
      customerClass.toLowerCase() === nextClass.toLowerCase()
  );

  if (duplicate) {
    return classes;
  }

  return classes.map((customerClass) =>
    customerClass.toLowerCase() === currentNormalised ? nextClass : customerClass
  );
}

export function removeCustomerClass(classes: string[], value: string) {
  if (classes.length <= 1) {
    return classes;
  }

  const target = value.toLowerCase();
  return classes.filter((customerClass) => customerClass.toLowerCase() !== target);
}
