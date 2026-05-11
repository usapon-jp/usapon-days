export default function WelcomeView({ onStart }) {
  return (
    <div className="welcome-view">
      <section className="login-preview">
        <span className="login-confetti login-confetti-1" />
        <span className="login-confetti login-confetti-2" />
        <span className="login-confetti login-confetti-3" />
        <span className="login-confetti login-confetti-4" />

        <div className="login-preview-main">
          <img
            className="login-preview-fusen"
            src={`${import.meta.env.BASE_URL}assets/welcome-fusen.png`}
            alt="うさぽんデイズのなかまたち"
          />
          <h1>うさぽんデイズ</h1>
          <p className="login-preview-subtitle">〜付箋で作る小さな世界〜</p>
        </div>

        <p className="login-preview-copy">
          つくって、ならべて、育てていく<br />
          あなただけの小さな毎日。
        </p>

        <div className="login-preview-dots" aria-hidden="true">
          <span className="is-active" />
          <span />
          <span />
        </div>

        <button className="login-preview-primary" type="button" onClick={onStart}>
          はじめる
        </button>
        <p className="login-preview-note">ログイン機能は準備中です</p>
      </section>
    </div>
  );
}
