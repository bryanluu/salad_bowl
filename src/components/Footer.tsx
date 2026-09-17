function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <span>© {currentYear} Bryan Luu</span>
    </footer>
  );
}

export default Footer;

