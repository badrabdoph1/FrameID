export class ContentNotFoundError extends Error {
  constructor(type: string) {
    super(`Content file not found: ${type}`)
    this.name = "ContentNotFoundError"
  }
}

export class ContentValidationError extends Error {
  public readonly errors: { path: string; message: string }[]

  constructor(type: string, errors: { path: string; message: string }[]) {
    super(`Validation failed for ${type}: ${errors.map((e) => e.message).join(", ")}`)
    this.name = "ContentValidationError"
    this.errors = errors
  }
}
