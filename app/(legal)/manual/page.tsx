'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'

type Role = 'coach' | 'athlete' | null

export default function ManualPage() {
  const [role, setRole] = useState<Role>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setRole(null); return }
      const snap = await getDoc(doc(db, 'users', user.uid))
      setRole((snap.data()?.role as Role) ?? null)
    })
    return () => unsub()
  }, [])

  return (
    <div className="space-y-2">
      {/* ヘッダー */}
      <div className="mb-10 border-b border-slate-800 pb-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            ユーザーマニュアル
          </span>
          <span className="text-xs text-slate-500">v1.0 · 2026年5月</span>
        </div>
        <h1 className="text-3xl font-bold text-white">
          {role === 'coach' ? 'コーチ向け使い方ガイド' : role === 'athlete' ? '選手向け使い方ガイド' : 'Coachpad の使い方'}
        </h1>
        <p className="mt-3 text-slate-400">
          {role === 'coach'
            ? 'トレーニング計画・フィードバック・AI活用など、コーチが使う機能を説明します。'
            : role === 'athlete'
              ? 'ワークアウト記録・体調管理・コーチとのやり取りなど、選手が使う機能を説明します。'
              : 'トレイルランニング・耐久系競技に特化したコーチングプラットフォームです。'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {(!role || role === 'coach') && (
            <a href="#coach" className="rounded-lg bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">
              コーチ向け →
            </a>
          )}
          {(!role || role === 'athlete') && (
            <a href="#athlete" className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors">
              選手向け →
            </a>
          )}
          <a href="#settings" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">
            設定 →
          </a>
          <a href="#faq" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">
            よくある質問 →
          </a>
        </div>
      </div>

      {/* 概要（未ログインまたは全員向け） */}
      {!role && (
        <Section id="overview" title="Coachpad とは">
          <p className="text-slate-400 leading-relaxed">
            Coachpad はコーチと選手が一緒に使うトレーニング管理アプリです。コーチはトレーニング計画の作成・フィードバック・データ分析をこのアプリで行い、選手はワークアウト記録・体調管理・コーチとのやり取りをここで完結できます。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FeatureCard color="violet" title="AIトレーニングプラン" desc="選手の現状とレース目標を入力するだけで、ピーキング理論に基づいた日毎のメニューをAIが自動生成" />
            <FeatureCard color="orange" title="Strava連携" desc="ガーミン・スント・カロスのデータをStrava経由で自動取り込み。記録の手間ゼロ" />
            <FeatureCard color="emerald" title="赤ペンフィードバック" desc="フォーム動画に直接書き込み。どこを直すかが一目で伝わる" />
            <FeatureCard color="blue" title="CTL/ATL/TSB管理" desc="フィットネス・疲労・調子をリアルタイムで把握。過負荷・怪我を予防" />
          </div>
        </Section>
      )}

      {/* コーチ向け（コーチまたは未ログイン） */}
      {role !== 'athlete' && (
        <>
          <div id="coach" className="pt-4">
            <RoleHeader label="コーチ向け機能" color="violet" />
          </div>

          <Section id="coach-dashboard" title="ダッシュボード">
            <p className="text-slate-400">ログイン直後に表示される画面です。</p>
            <ul className="mt-3 space-y-1.5 text-slate-400">
              <Li text="担当選手一覧と最終ログイン日" />
              <Li text="各選手のCTL（フィットネス）・ATL（疲労）・TSB（調子）の最新値" />
              <Li text="選手ページへの直接リンク" />
            </ul>
          </Section>

          <Section id="coach-athletes" title="選手管理">
            <SubSection title="選手の招待">
              <ol className="space-y-2 text-slate-400">
                <Step n={1} text="設定 → チーム管理 を開く" />
                <Step n={2} text="「招待リンクを生成」ボタンをタップ" />
                <Step n={3} text="表示されたリンクをコピーして選手に送る" />
              </ol>
              <Note text="招待リンクは7日間有効です。期限切れの場合は再生成してください。" />
            </SubSection>
            <SubSection title="選手の詳細確認">
              <Table
                headers={['項目', '内容']}
                rows={[
                  ['フィットネス指標', 'CTL・ATL・TSB（30日グラフ）'],
                  ['ウェルネス推移', '体調グラフ（30日）'],
                  ['ランニング設定', 'LTHR・最大心拍・閾値ペース・FTP'],
                  ['コーチングプラン', 'Basic / Standard / Premium'],
                ]}
              />
            </SubSection>
          </Section>

          <Section id="coach-calendar" title="カレンダー・メニュー計画">
            <SubSection title="メニューの手動作成">
              <ol className="space-y-2 text-slate-400">
                <Step n={1} text="選手のカレンダーを開く" />
                <Step n={2} text="日付右上の ＋ ボタンをタップ" />
                <Step n={3} text="タブを選択して内容を入力" />
              </ol>
              <div className="mt-3 space-y-2">
                <TabCard label="ランニング" desc="距離・時間・ペース・ワークアウトタイプを設定" />
                <TabCard label="筋トレ" desc="種目ライブラリから種目を選んでセット・回数・休息を設定" />
                <TabCard label="プロトコル" desc="事前作成した筋トレテンプレートを割り当て" />
              </div>
            </SubSection>
            <SubSection title="カレンダーの色分け">
              <div className="flex flex-wrap gap-2">
                <Badge color="yellow" label="計画済みランニング" />
                <Badge color="green" label="筋力トレーニング" />
                <Badge color="blue" label="休養日" />
                <Badge color="emerald" label="完了済み" />
              </div>
            </SubSection>
            <SubSection title="ドラッグ＆ドロップ">
              <ul className="space-y-1.5 text-slate-400">
                <Li text="メニューを別の日へドラッグするとコピー" />
                <Li text="Shift＋ドロップで移動（元は削除）" />
              </ul>
            </SubSection>
          </Section>

          <Section id="coach-ai-plan" title="AIトレーニングプラン生成">
            <p className="text-slate-400 mb-4">選手のカレンダーから「AIで週間プラン作成」ボタンで開きます。</p>
            <SubSection title="設定項目">
              <Table
                headers={['項目', '説明']}
                rows={[
                  ['開始日', 'プランを始める日付'],
                  ['期間', '1〜8週間'],
                  ['目標レース日', '設定すると逆算してピーキングされる'],
                  ['レース距離', 'km単位で入力'],
                  ['現状のフィットネス', 'CTL/ATLなど自動取得済み・補足を追記可'],
                  ['追加要望', '「坂道強化を重点的に」など自由記述'],
                ]}
              />
            </SubSection>
            <SubSection title="ピーキング理論（自動適用）">
              <Table
                headers={['フェーズ', 'レースまでの日数', '内容']}
                rows={[
                  ['ボリューム期', '42日以上', '有酸素ベース構築・走行量確保'],
                  ['ビルド期', '14〜42日', '強度・距離を上げる'],
                  ['ピーク', '8〜14日', '量を10〜20%減少'],
                  ['テーパー', '1〜7日', '量を50%まで減量'],
                  ['レースウィーク', '±3日', '軽いジョグ・休養中心'],
                  ['リカバリー', 'レース後14日', '強度練習禁止'],
                ]}
              />
            </SubSection>
          </Section>

          <Section id="coach-templates" title="筋トレテンプレート管理">
            <p className="text-slate-400 mb-4">メニュー → 筋トレ → テンプレート から管理します。</p>
            <SubSection title="AIで生成">
              <ol className="space-y-2 text-slate-400">
                <Step n={1} text="「AIで生成」ボタンをタップ" />
                <Step n={2} text="例）「トレイルランナー向け大腿部強化 40分 自体重中心」と入力" />
                <Step n={3} text="AIが種目・セット数・回数・休息を含むプロトコルを生成" />
                <Step n={4} text="内容を確認して「保存」" />
              </ol>
            </SubSection>
            <SubSection title="選手への割り当て">
              <ol className="space-y-2 text-slate-400">
                <Step n={1} text="テンプレート詳細 → 「選手に割り当て」をタップ" />
                <Step n={2} text="日付を選択" />
                <Step n={3} text="割り当てる選手にチェック" />
                <Step n={4} text="「割り当て」ボタンで保存" />
              </ol>
            </SubSection>
          </Section>

          <Section id="coach-exercises" title="種目ライブラリ管理">
            <p className="text-slate-400 mb-4">メニュー → 筋トレ → 種目ライブラリ から管理します。</p>
            <ol className="space-y-2 text-slate-400">
              <Step n={1} text="「AIで一括追加」ボタンをタップ" />
              <Step n={2} text="例）「股関節安定性向上の種目を10個」と入力" />
              <Step n={3} text="AIが種目リストを生成" />
              <Step n={4} text="追加する種目にチェックして「保存」" />
            </ol>
            <Note text="AIプランで筋トレメニューを生成するには、先に種目ライブラリに種目を登録してください。" />
          </Section>

          <Section id="coach-motion" title="フォーム動画フィードバック（赤ペン）">
            <p className="text-slate-400 mb-4">メニュー → 動作分析 から選手の動画に直接書き込みができます。</p>
            <ol className="space-y-2 text-slate-400">
              <Step n={1} text="動作分析一覧で「確認待ち」の動画をタップ" />
              <Step n={2} text="動画を再生して気になる場面で一時停止" />
              <Step n={3} text="「この瞬間に書き込む（赤ペン）」ボタンをタップ" />
              <Step n={4} text="画面に直接線・矢印などを書き込む" />
              <Step n={5} text="コメントを入力して保存" />
            </ol>
          </Section>

          <Section id="coach-ai-profile" title="AIプロフィール設定">
            <p className="text-slate-400 mb-4">設定 → AIプロフィール からAIへのコーチングスタイルを設定します。</p>
            <Table
              headers={['項目', '内容例']}
              rows={[
                ['コーチング哲学', '「選手の自律性を重視し...」'],
                ['トレーニング方法論', '「MAFトレーニングを基本とし...」'],
                ['優先事項', '「怪我予防を最優先...」'],
                ['栄養アドバイス', '「レース前の糖質摂取については...」'],
                ['怪我予防', '「腸腰筋・臀筋の強化を必ず含める」'],
                ['参考文献', '参考にしている書籍・論文・コーチ名'],
                ['カスタム指示', 'その他AIへの指示'],
              ]}
            />
            <Note text="PDFや資料をアップロードすると、AIがその内容を参照してプランを生成します。" />
          </Section>
        </>
      )}

      {/* 選手向け（選手またはロール未確定） */}
      {role !== 'coach' && (
        <>
          <div id="athlete" className="pt-4">
            <RoleHeader label="選手向け機能" color="emerald" />
          </div>

          <Section id="athlete-workout" title="ワークアウト記録">
            <p className="text-slate-400 mb-4">Strava連携を設定している場合は自動で取り込まれます。手動記録はカレンダー → 「記録する」から行います。</p>
            <Table
              headers={['項目', '内容']}
              rows={[
                ['ワークアウトタイプ', 'イージーラン・テンポ走・インターバル・ロング走 など'],
                ['距離', 'km単位'],
                ['時間', '分単位'],
                ['平均ペース', '分:秒/km'],
                ['平均・最大心拍', 'bpm'],
                ['獲得標高', 'm'],
                ['メモ', '自由記述'],
              ]}
            />
            <SubSection title="ワークアウト達成率">
              <div className="flex flex-wrap gap-2">
                <Badge color="emerald" label="90%以上 — 達成" />
                <Badge color="yellow" label="70〜90% — 概ね達成" />
                <Badge color="red" label="70%未満 — 未達" />
              </div>
            </SubSection>
          </Section>

          <Section id="athlete-strength" title="筋トレ実施報告">
            <p className="text-slate-400 mb-4">コーチから筋トレが割り当てられたら通知が届きます。カレンダーの筋トレメニューをタップして報告します。</p>
            <ol className="space-y-2 text-slate-400">
              <Step n={1} text="カレンダーの筋トレメニューをタップ" />
              <Step n={2} text="「実施報告」ボタンをタップ" />
              <Step n={3} text="各種目の実際のセット数・回数・重量を入力" />
              <Step n={4} text="全体の難易度（RPE 1〜5）を選択" />
              <Step n={5} text="痛みがあった場合は部位と詳細を記入" />
              <Step n={6} text="コーチへのメッセージを入力して「送信」" />
            </ol>
          </Section>

          <Section id="athlete-wellness" title="ウェルネス記録">
            <p className="text-slate-400 mb-4">メニュー → ウェルネス から毎日の体調を記録します。</p>
            <Table
              headers={['項目', 'スケール']}
              rows={[
                ['睡眠時間', '時間（数値入力）'],
                ['安静時心拍', 'bpm'],
                ['体重', 'kg'],
                ['睡眠の質', '1（最悪）〜 5（最高）'],
                ['疲労感', '1（爽快）〜 5（極度疲労）'],
                ['筋肉痛', '1（なし）〜 5（ひどい）'],
                ['気分', '1（最悪）〜 5（最高）'],
                ['ストレス', '1（なし）〜 5（極度）'],
                ['メモ', '自由記述'],
              ]}
            />
            <SubSection title="タブ">
              <div className="space-y-2">
                <TabCard label="記録する" desc="今日の体調を入力" />
                <TabCard label="体調推移" desc="グラフで過去の傾向を確認（7/14/30/90日）" />
                <TabCard label="記録履歴" desc="過去の記録一覧" />
              </div>
            </SubSection>
          </Section>

          <Section id="athlete-motion" title="フォーム動画アップロード">
            <p className="text-slate-400 mb-4">メニュー → 動作分析 → 「新規アップロード」からコーチにフォームチェックを依頼できます。</p>
            <ol className="space-y-2 text-slate-400">
              <Step n={1} text="動作タイプを選択（ランニングフォーム・スクワット など）" />
              <Step n={2} text="気になる点やコーチへの質問を入力" />
              <Step n={3} text="動画ファイルを選択してアップロード" />
            </ol>
            <Note text="コーチがフィードバックを追加すると通知が届きます。" />
          </Section>

          <Section id="athlete-strava" title="Strava連携">
            <p className="text-slate-400 mb-4">設定 → Strava連携 からGPSウォッチのデータを自動取り込みできます。</p>
            <ol className="space-y-2 text-slate-400">
              <Step n={1} text="設定画面の「Stravaに接続」ボタンをタップ" />
              <Step n={2} text="Stravaのログイン画面でメールアドレス・パスワードを入力" />
              <Step n={3} text="「許可する」をタップ" />
              <Step n={4} text="「接続済」と表示されれば完了" />
            </ol>
            <Note text="接続後はStravaにアクティビティを記録するだけで自動的にカレンダーに反映されます。" />
          </Section>
        </>
      )}

      {/* 共通設定 */}
      <div id="settings" className="pt-4">
        <RoleHeader label="共通設定" color="slate" />
      </div>

      <Section id="settings-profile" title="プロフィール編集">
        <p className="text-slate-400 mb-4">設定 → プロフィール から編集します。</p>
        <Table
          headers={['項目', '対象']}
          rows={[
            ['名前・性別・生年月日', '全員'],
            ['身長・体重', '全員'],
            ['居住地・自己紹介', '全員'],
            ['LTHR（乳酸閾値心拍）', '選手のみ'],
            ['最大心拍・安静時心拍', '選手のみ'],
            ['閾値ペース', '選手のみ'],
            ['FTP', '選手のみ'],
          ]}
        />
        <Note text="LTHRを設定すると5段階の心拍ゾーンが自動計算されます。" />
      </Section>

      {role !== 'coach' && (
        <>
          <Section id="settings-races" title="ターゲットレース設定">
            <p className="text-slate-400 mb-4">設定 → ターゲットレース から目標レースを登録します。AIが逆算してピーキング計画を立てます。</p>
            <ol className="space-y-2 text-slate-400">
              <Step n={1} text="「レースを追加」ボタンをタップ" />
              <Step n={2} text="レース名・日付・距離（km）を入力して「保存」" />
            </ol>
            <Note text="カレンダーにはレース日にトロフィーアイコンが表示され、現在のトレーニングフェーズも確認できます。" />
          </Section>

          <Section id="settings-tests" title="初期テスト">
            <p className="text-slate-400 mb-4">設定 → 初期テストガイド から基準値を測定します。初めてCoachpadを使う場合に行います。</p>
            <Table
              headers={['テスト', '目的']}
              rows={[
                ['基本測定', '身長・体重・安静時心拍・年齢の入力'],
                ['20分全力走', 'LTHR（乳酸閾値心拍）と閾値ペースの計測'],
                ['5kmタイムトライアル', '5km閾値ペースの計測'],
                ['FTPテスト', '自転車のFTP（機能的閾値パワー）計測'],
              ]}
            />
          </Section>
        </>
      )}

      {/* FAQ */}
      <div id="faq" className="pt-6">
        <h2 className="text-2xl font-bold text-white mb-4">よくある質問</h2>
      </div>

      <div className="space-y-3">
        {role !== 'coach' && (
          <FaqItem q="Stravaに記録したのにカレンダーに反映されない" a="通常は数分以内に自動反映されます。反映されない場合は「設定 → Strava連携 → 過去30日を同期」ボタンで手動取り込みしてください。" />
        )}
        <FaqItem q="パスワードを忘れた" a="ログイン画面の「パスワードを忘れた」からリセットメールを送信できます。" />
        {role !== 'athlete' && (
          <FaqItem q="AIプランで筋トレメニューが生成されない" a="「種目ライブラリ」に種目を登録していない場合、筋トレ日は生成されません。先に種目ライブラリに種目を追加してください。" />
        )}
        {role !== 'coach' && (
          <FaqItem q="心拍ゾーンが表示されない" a="設定 → プロフィール でLTHR（乳酸閾値心拍）を設定するとゾーンが自動計算されます。「初期テストガイド」の「20分全力走テスト」で計測できます。" />
        )}
        <FaqItem q="CTL/ATLとは何ですか" a="トレーニング負荷の指標です。CTL（慢性トレーニング負荷）はフィットネスの蓄積、ATL（急性トレーニング負荷）は直近の疲労、TSB（トレーニングストレスバランス）はその差で調子を表します。Strava連携またはワークアウト記録により自動更新されます。" />
        {role !== 'coach' && (
          <FaqItem q="動画アップロードができない" a="コーチが招待済みであることが必要です。コーチが未設定の場合はアップロードできません。" />
        )}
      </div>

      {/* フッター */}
      <div className="mt-12 border-t border-slate-800 pt-8 text-center">
        <p className="text-sm text-slate-500">Coachpad は合同会社コアデザインが開発・運営しています。</p>
        <p className="mt-1 text-sm text-slate-500">
          お問い合わせ:{' '}
          <a href="mailto:s.hanawa@coredesign-athlete.com" className="text-emerald-400 hover:underline">
            s.hanawa@coredesign-athlete.com
          </a>
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-600">
          <Link href="/terms" className="hover:text-slate-400">利用規約</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-slate-400">プライバシーポリシー</Link>
          <span>·</span>
          <Link href="/login" className="hover:text-slate-400">ログイン</Link>
        </div>
      </div>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {children}
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

function RoleHeader({ label, color }: { label: string; color: string }) {
  const colorMap: Record<string, string> = {
    violet: 'border-violet-500/30 bg-violet-500/5 text-violet-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
    slate: 'border-slate-700 bg-slate-800/50 text-slate-300',
  }
  return (
    <div className={`rounded-xl border px-5 py-4 ${colorMap[color] ?? colorMap.slate}`}>
      <h2 className="text-lg font-bold">{label}</h2>
    </div>
  )
}

function FeatureCard({ color, title, desc }: { color: string; title: string; desc: string }) {
  const colorMap: Record<string, string> = {
    violet: 'border-violet-500/20 bg-violet-500/5',
    orange: 'border-orange-500/20 bg-orange-500/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
    blue: 'border-blue-500/20 bg-blue-500/5',
  }
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color] ?? ''}`}>
      <div className="font-semibold text-white text-sm mb-1">{title}</div>
      <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
    </div>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-300 mt-0.5">{n}</span>
      <span>{text}</span>
    </li>
  )
}

function Li({ text }: { text: string }) {
  return (
    <li className="flex gap-2">
      <span className="text-slate-500 mt-1">·</span>
      <span>{text}</span>
    </li>
  )
}

function Note({ text }: { text: string }) {
  return (
    <div className="flex gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
      <span className="shrink-0">💡</span>
      <span>{text}</span>
    </div>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {headers.map((h) => (
              <th key={h} className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-800/50">
              {row.map((cell, j) => (
                <td key={j} className={`py-2 pr-4 ${j === 0 ? 'font-medium text-slate-200' : 'text-slate-400'}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Badge({ color, label }: { color: string; label: string }) {
  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-600/20 text-yellow-300',
    green: 'bg-green-600/20 text-green-300',
    blue: 'bg-blue-600/20 text-blue-300',
    emerald: 'bg-emerald-600/20 text-emerald-300',
    red: 'bg-red-600/20 text-red-300',
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colorMap[color] ?? 'bg-slate-700 text-slate-300'}`}>{label}</span>
  )
}

function TabCard({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="shrink-0 rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">{label}</span>
      <span className="text-slate-400">{desc}</span>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex gap-3">
        <span className="shrink-0 text-emerald-400 font-bold text-sm">Q.</span>
        <p className="font-medium text-white text-sm">{q}</p>
      </div>
      <div className="flex gap-3 mt-2">
        <span className="shrink-0 text-slate-500 font-bold text-sm">A.</span>
        <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  )
}
