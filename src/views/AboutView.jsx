export default function AboutView() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>SUMMARY OF BRIAN TRACY&apos;S BOOK</h2>
        <p className="text-xl font-semibold text-orange-200">Eat That Frog!</p>
        <p className="text-gray-400 text-sm mt-1">21 Great Ways to Stop Procrastinating and Get More Done in Less Time</p>
      </div>
      <div className="space-y-6 text-gray-300">
        <section className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-200 mb-3">Why &quot;Eat That Frog&quot;?</h3>
          <p className="leading-relaxed mb-2">If you have to eat a frog, do it first thing in the morning. If you have to eat two frogs, eat the biggest one first.</p>
          <p className="leading-relaxed">The <strong className="text-white">frog</strong> is your <strong className="text-white">most important task</strong> — the one that will bring you the most success. These tasks often deliver five or ten times the value of others. They&apos;re also usually the hardest. You can&apos;t eat every tadpole in the pond, but eating the <strong className="text-white">biggest and ugliest frog</strong> first sets you up for consistent success.</p>
        </section>
        <section className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-200 mb-3">Three Questions to Ask Yourself</h3>
          <p className="text-sm text-gray-400 mb-2">To maximize productivity and eat your frog first:</p>
          <ul className="space-y-2 list-none">
            <li className="flex gap-2"><span className="text-orange-400">1.</span> What are my highest-value activities?</li>
            <li className="flex gap-2"><span className="text-orange-400">2.</span> What can I, and only I, do that, if done well, will make a genuine difference?</li>
            <li className="flex gap-2"><span className="text-orange-400">3.</span> What is the most valuable use of my time right now?</li>
          </ul>
        </section>
        <section className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-200 mb-3">Planning: Think on Paper</h3>
          <p className="leading-relaxed mb-2">Decide what you want and <strong className="text-white">write it down</strong>. Set a deadline and sub-deadlines — without them, goals lack urgency. Create a list of sub-tasks, organise them into a plan, visualise it, then take action. Build in daily activities that move you toward your goals.</p>
          <p className="text-orange-200 font-medium italic">Proper Prior Planning Prevents Poor Performance.</p>
        </section>
        <section className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-200 mb-3">A Step-by-Step Approach to Planning</h3>
          <ul className="space-y-2">
            <li><strong className="text-white">Write a list</strong> — everything you have to do before you work through the plan.</li>
            <li><strong className="text-white">Work from the list</strong> — treat it as your reference. Add new things to the list first, even if urgent.</li>
            <li><strong className="text-white">Plan ahead</strong> — e.g. the night before; let your subconscious work on it overnight.</li>
            <li><strong className="text-white">Update the list</strong> — move unfinished items to the next day and tick off completed ones.</li>
          </ul>
        </section>
        <section className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-200 mb-3">Focus on the Top 20 Percent</h3>
          <p className="leading-relaxed">Refuse to work on the bottom 80 percent while you still have tasks in the top 20 percent. Practising this consistently builds the habit of tackling the most critical tasks first.</p>
        </section>
        <section className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-200 mb-3">Key Result Areas</h3>
          <p className="leading-relaxed">Key result areas are areas of work for which <strong className="text-white">you</strong> are entirely responsible. If you don&apos;t do this work, it won&apos;t get done — and the output is often crucial for others. Find them by listing your most important output responsibilities and asking what others need from you to start their work.</p>
        </section>
        <section className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-200 mb-3">Why We Procrastinate — and How to Get Better</h3>
          <p className="leading-relaxed mb-2">A major cause of procrastination is feeling weak or deficient in one part of a task. The more you practise, the better you get at eating that kind of frog.</p>
          <p className="leading-relaxed text-orange-200 font-medium">Everything is learnable.</p>
        </section>
        <section className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-200 mb-3">The ABCDE Method (Priority System)</h3>
          <p className="leading-relaxed mb-3">Tracy recommends labelling tasks by impact. This app uses the same A–E priorities:</p>
          <ul className="space-y-1.5 text-sm">
            <li><strong className="text-white">A</strong> — Must do; serious consequences if you don&apos;t.</li>
            <li><strong className="text-white">B</strong> — Should do; mild consequences.</li>
            <li><strong className="text-white">C</strong> — Nice to do; no consequences.</li>
            <li><strong className="text-white">D</strong> — Delegate; someone else can do it.</li>
            <li><strong className="text-white">E</strong> — Eliminate; drop it if it no longer matters.</li>
          </ul>
        </section>
        <section className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-200 mb-3">You Are Unique</h3>
          <p className="leading-relaxed">You have talents and abilities that nobody else has. The goal of this method — and this app — is to help you use your time and focus where they matter most: on your frog first.</p>
        </section>
        <section className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-200 mb-3">Using this app</h3>
          <ul className="space-y-2 text-sm leading-relaxed list-none">
            <li><strong className="text-white">Board</strong> — Kanban by priority (A–E) and status; drag tasks, mark your daily frog, use Pomodoro and Focus mode from the header.</li>
            <li><strong className="text-white">Schedule &amp; Analytics</strong> — Plan by date and review productivity and water at a glance.</li>
            <li><strong className="text-white">Fitness</strong> — Log weight and workouts; charts use the unit saved with each day.</li>
            <li><strong className="text-white">Sync</strong> — In Settings, optional Firebase sync keeps the same data across devices when you use the same sync code.</li>
            <li><strong className="text-white">Backup</strong> — Export JSON for a full offline copy; use merge import to combine with another device&apos;s file if needed.</li>
          </ul>
        </section>
        <section className="bg-gradient-to-r from-orange-600/20 to-slate-800 rounded-xl p-6 border border-orange-500/30 text-center">
          <p className="text-gray-300 text-sm italic">Brian Tracy, <em>Eat That Frog!</em> — 21 Great Ways to Stop Procrastinating and Get More Done in Less Time.</p>
        </section>
      </div>
    </div>
  );
}
