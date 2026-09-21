import { copy } from '../copy/en.ts'
import { assetUrl } from '../assets.ts'

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className='game-start' aria-labelledby="game-start-title">
      <header>
        <h1 id="game-start-title">
          {copy.start.title}
        </h1>
      </header>
      <img id="logo" src={assetUrl('logo.svg')} alt="Cartoon of a smiling salad bowl" />
      <button className='btn btn--primary' onClick={onStart} autoFocus>{copy.start.button}</button>
    </section>
  )
}

export default StartScreen
