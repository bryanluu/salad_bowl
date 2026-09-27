import { faker } from '@faker-js/faker'

// Define a type for the generatedWord object
type GeneratedWordType = {
  word: () => string;
  animal: () => string;
  books: () => string;
  musician: () => string;
  food: () => string;
}

// Create the generatedWord object with the type
const pickRandomWord: GeneratedWordType = {
  word: () => faker.word.adjective() + " " + faker.word.noun(),
  animal: () => faker.animal.type(),
  books: () => faker.book.series(),
  musician: () => faker.music.artist(),
  food: () => {
    const choice = Math.floor(Math.random() * 3)
    switch (choice) {
      case 0:
        return faker.food.meat()
      case 1:
        return faker.food.fruit()
      case 2:
        return faker.food.vegetable()
      default:
        return ""
    }
  },
};

export function generateWord() {
  const kinds = Object.keys(pickRandomWord) as Array<keyof GeneratedWordType>
  const randomIndex = Math.floor(Math.random() * kinds.length)
  const kind = kinds[randomIndex]
  const generated = pickRandomWord[kind]()
  return generated;
}
