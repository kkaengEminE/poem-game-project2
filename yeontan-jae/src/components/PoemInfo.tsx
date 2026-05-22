import { useNavigate } from '@tanstack/react-router';

export default function PoemInfo() {
  const navigate = useNavigate();

  return (
    <div id="poem-screen" className="active">
      <div className="poem-info-wrap">
        <div className="pi-title">연탄재 함부로 차지 마라</div>
        <div className="pi-author">안도현 (安度眩, 1961–)</div>

        <div className="pi-poem">
          연탄재 함부로 차지 마라<br />
          너는<br />
          누구에게 한번이라도<br />
          뜨거운 사람이었느냐
        </div>

        <div className="pi-desc">
          <p>
            안도현은 경상북도 예천 출신의 시인으로, 1984년 대구매일신문
            신춘문예에 당선되어 등단했습니다. 서정적이면서도 삶의 진실을
            날카롭게 포착하는 시를 써왔으며, 대표 시집으로 『모닥불』
            『그리운 여우』 등이 있습니다.
          </p>
          <p>
            이 시에서 '연탄재'는 자신의 모든 열을 다 내어준 뒤 하얗게
            식어버린 연탄의 잔해입니다. 한때 뜨겁게 타올라 누군가의 방을
            데워주고, 누군가의 밥을 지어준 존재. 다 타고 난 뒤의 모습이
            초라하다고 함부로 발로 차서는 안 된다는 것입니다.
          </p>
          <p>
            「연탄재 함부로 차지 마라」(1996, 시집 『외눈박이 물고기의 사랑』
            수록)는 단 네 줄로 깊은 울림을 전합니다. '너는 누구에게
            한번이라도 뜨거운 사람이었느냐'라는 질문은 독자 자신에게로
            돌아옵니다. 자신의 온기를 다 써버린 존재를 함부로 대하기 전에,
            나 자신은 과연 누군가에게 그만큼 뜨거웠는지를 되묻는 시입니다.
          </p>
          <p>
            1990년대 한국 사회의 급격한 변화 속에서, 이 시는 잊혀가는
            이웃에 대한 따뜻한 시선과 자기 성찰의 메시지로 많은 사람들에게
            사랑받았습니다. 연탄이 사라져가는 시대에도 이 시가 여전히
            읽히는 것은, '뜨거운 사람'이라는 물음이 시대를 초월하기
            때문입니다.
          </p>
        </div>

        <button className="back-btn" onClick={() => navigate({ to: '/' })}>
          &larr; 돌아가기
        </button>
      </div>
    </div>
  );
}
