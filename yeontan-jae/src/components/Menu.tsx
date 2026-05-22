import { useNavigate } from '@tanstack/react-router';

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div id="menu-screen">
      <div className="menu-tag">POEM GAME</div>
      <div className="menu-title">
        연탄재 함부로<br />차지 마라
      </div>
      <div className="menu-author">안도현 (安度眩)</div>
      <div className="menu-year">1996</div>
      <div className="menu-buttons">
        <button
          className="menu-btn"
          onClick={() => navigate({ to: '/game' })}
        >
          시작하기
        </button>
        <button
          className="menu-btn"
          onClick={() => navigate({ to: '/settings' })}
        >
          설정
        </button>
        <button
          className="menu-btn"
          onClick={() => navigate({ to: '/poem' })}
        >
          연탄재 함부로 차지 마라란
        </button>
      </div>
    </div>
  );
}
