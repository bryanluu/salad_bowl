import { copy } from '../copy/en.ts'
import { assetUrl } from '../assets.ts'
import { useSoundEffects } from '../hooks/useSoundEffects'

// Resume is only offered when there's a saved game to resume from (the parent
// omits `onResume` otherwise), so it takes the primary slot and Play steps
// down to secondary. With no save, Play keeps its original primary look.
function StartScreen({ onStart, onResume }: { onStart: () => void, onResume?: () => void }) {
  const { play } = useSoundEffects()
  return (
    <section className='game-start' aria-labelledby="game-start-title">
      <header>
        <h1 id="game-start-title">
          {copy.start.title}
        </h1>
      </header>
      <img src={assetUrl('logo.svg')} alt="Cartoon of a smiling salad bowl" className="logo" />
      {onResume ?
        <>
          <button className='btn btn--primary' onClick={() => { play('tap'); onResume() }} autoFocus>{copy.start.resumeButton}</button>
          <button className='btn btn--secondary' onClick={() => { play('tap'); onStart() }}>{copy.start.button}</button>
        </>
        :
        <button className='btn btn--primary' onClick={() => { play('tap'); onStart() }} autoFocus>{copy.start.button}</button>}
    </section>
  )
}

export default StartScreen
