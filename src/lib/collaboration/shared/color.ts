function createRandomHue() {
  return Math.floor(Math.random() * 360)
}

export function createParticipantColor() {
  return `hsl(${createRandomHue()}, 85%, 65%)`
}

export function createCursorColor() {
  return `hsl(${createRandomHue()}, 100%, 70%)`
}
