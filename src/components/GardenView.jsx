import { Sprout } from 'lucide-react';

export default function GardenView() {
  return (
    <div className="garden-view">
      <header className="garden-header">
        <h1>お庭</h1>
        <span><Sprout size={18} /> coming soon</span>
      </header>

      <section className="garden-stage">
        <img src={`${import.meta.env.BASE_URL}assets/home-garden-reference.jpg`} alt="うさぽんの小さな箱庭" />
        <div>
          <p>うさぽんの小さな箱庭</p>
          <span>育てたり、飾ったりできる場所を準備中です。</span>
        </div>
      </section>
    </div>
  );
}
