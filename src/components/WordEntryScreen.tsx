// Static skeleton only — word list state (adding/removing words, the
// 8/20 counter) isn't wired up yet. Matches the word-entry wireframe.
function WordEntryScreen() {
  return (
    <section className="screen" aria-labelledby="word-entry-title">
      <header className="screen__header">
        <h1 className="screen__title" id="word-entry-title">
          Add your words
        </h1>
      </header>

      <form className="input-add" onSubmit={(event) => event.preventDefault()}>
        <label className="sr-only" htmlFor="word-input">
          Word
        </label>
        <input className="input" id="word-input" type="text" placeholder="Enter a word" />
        <button className="btn btn--secondary btn--icon" type="submit" aria-label="Add word">
          +
        </button>
      </form>

      <ul className="word-list">
        <li className="word-list__item">
          <span>Guitar</span>
          <button className="word-list__remove" type="button" aria-label="Remove word">
            &times;
          </button>
        </li>
        <li className="word-list__item">
          <span>Volcano</span>
          <button className="word-list__remove" type="button" aria-label="Remove word">
            &times;
          </button>
        </li>
      </ul>

      <p className="counter">8 / 20 words</p>

      <button className="btn btn--primary" type="button">
        Done adding words
      </button>
    </section>
  )
}

export default WordEntryScreen
