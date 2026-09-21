function Footer({ showLogo = false }: { showLogo: boolean }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      {showLogo &&
        <a href="/">
          <img src="public/logo.svg" alt="Cute cartoon of smiling salad bowl"
            className="logo" />
        </a>}
      <span>© {currentYear} Bryan Luu</span>
    </footer>
  );
}

export default Footer;

