'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'

// 問い合わせ先
const CONTACT_EMAIL = 'info@coredesign-athlete.com'
// 公式LINEのURL（未設定なら表示しない）。例: 'https://lin.ee/xxxxxxx'
const LINE_URL = ''

type Role = 'coach' | 'athlete' | null

export default function ManualPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setRole(null); setIsAdmin(false); return }
      const snap = await getDoc(doc(db, 'users', user.uid))
      setRole((snap.data()?.role as Role) ?? null)
      setIsAdmin(snap.data()?.isAdmin === true)
    })
    return () => unsub()
  }, [])

  return (
    <div className="space-y-2">
      {/* 戻る */}
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        戻る
      </button>

      {/* ヘッダー */}
      <div className="mb-10 border-b border-slate-800 pb-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            ユーザーマニュアル
          </span>
          <span className="text-xs text-slate-500">v2.0 · 2026年6月</span>
        </div>
        <h1 className="text-3xl font-bold text-white">
          {role === 'coach' ? 'コーチ向け使い方ガイド' : role === 'athlete' ? '選手向け使い方ガイド' : 'Coachpad の使い方'}
        </h1>
        <p className="mt-3 text-slate-400">
          {role === 'coach'
            ? 'トレーニング計画・フィードバック・AI活用など、コーチが使う機能を説明します。'
            : role === 'athlete'
              ? 'ワークアウト記録・体調管理・コーチとのやり取りなど、選手が使う機能を説明します。'
              : 'ランニングからジュニアスポーツ・競技アスリート・運動愛好家・ダイエットまで、あらゆる活動に対応する万能型コーチングプラットフォームです。'}
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
            Coachpad はコーチと選手が一緒に使うトレーニング管理アプリです。コーチはトレーニング計画の作成・フィードバック・データ分析をこのアプリで行い、選手はワークアウト記録・体調管理・コーチとのやり取りをここで完結できます。選手ごとに「アクティビティタイプ」を設定でき、ランニング・ジュニア・競技アスリート・運動愛好家・ダイエットのそれぞれに最適化された記録項目・指標・AIメニューに切り替わります。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FeatureCard color="violet" title="AIトレーニングプラン" desc="選手の現状と目標を入力するだけで、アクティビティタイプに応じた日毎のメニューをAIが自動生成" />
            <FeatureCard color="orange" title="多競技対応プリセット" desc="ランニング／ジュニア／競技アスリート／運動愛好家／ダイエットに応じて記録項目・指標・AIが自動で切り替わる" />
            <FeatureCard color="emerald" title="赤ペンフィードバック" desc="フォーム動画に直接書き込み。どこを直すかが一目で伝わる" />
            <FeatureCard color="blue" title="指標管理" desc="CTL/ATL/TSB（ランニング系）や体重・体脂肪・カロリー（ダイエット系）など目的に応じた指標をグラフで把握" />
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
                  ['アクティビティタイプ', 'ランニング/ジュニア/競技/愛好家/ダイエットを選手ごとに設定'],
                  ['フィジカルテスト設定', 'サッカー・テニス等の競技に必要なテストを選手ごとに割り当て'],
                  ['フィットネス指標', 'CTL・ATL・TSB（30日グラフ・ランニング/競技）'],
                  ['ウェルネス推移', '体調グラフ（30日）'],
                  ['ランニング設定', 'LTHR・最大心拍・閾値ペース・FTP（ランニング系）'],
                  ['コーチングプラン', 'サポート / ライト / スタンダード / プレミアム'],
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
            <p className="text-slate-400 mb-4">Strava連携を設定している場合は自動で取り込まれます。手動記録はカレンダー → 「記録する」から行います。表示される入力項目はアクティビティタイプによって自動的に切り替わります。</p>
            <Table
              headers={['項目', '内容']}
              rows={[
                ['セッション種別', 'タイプごとの種別（イージーラン／スプリント／筋力トレーニング など）'],
                ['距離・ペース・標高', 'ランニング系タイプで表示（km・分:秒/km・m）'],
                ['時間', '分単位（全タイプ共通）'],
                ['平均・最大心拍', 'bpm'],
                ['RPE（主観的運動強度）', '競技アスリートタイプ'],
                ['体重・体脂肪率・消費カロリー', 'ダイエット・運動愛好家タイプ'],
                ['TSS / CTL / ATL', 'ランニング・競技タイプ（Garmin等から）'],
                ['メモ', '自由記述'],
              ]}
            />
            <Note text="記録した内容はワークアウト詳細ページで確認でき、ダイエットタイプでは体重・体脂肪の推移がダッシュボードのグラフに反映されます。" />
            <SubSection title="ワークアウト達成率（計画がある場合）">
              <div className="flex flex-wrap gap-2">
                <Badge color="emerald" label="95%以上 — 達成" />
                <Badge color="yellow" label="70〜95% — 概ね達成" />
                <Badge color="red" label="40%未満 — 未達" />
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

      <Section id="settings-activity" title="アクティビティタイプ（目的別プリセット）">
        <p className="text-slate-400 mb-4">
          選手ごとに取り組む活動を選ぶと、記録項目・表示される指標・AIメニュー・期分け・ダッシュボードのグラフがそのタイプに最適化されます。コーチは選手詳細ページから、選手自身は「設定 → プロフィール」から変更できます。コーチは「既定アクティビティタイプ」を設定でき、招待した新しい選手に自動適用されます。
        </p>
        <Table
          headers={['タイプ', '主な指標', '向いている人']}
          rows={[
            ['ランニング', '距離・ペース・心拍・TSS/CTL/ATL', 'レースを目指すランナー（既定）'],
            ['ジュニアスポーツ', '時間・距離（任意）', '成長期の選手。発育発達・多様な動作・楽しさ重視'],
            ['競技アスリート（S&C）', '時間・RPE・心拍・TSS', '競技の強化。ストレングス&コンディショニング'],
            ['運動愛好家', '時間・体重・体脂肪', '健康維持・運動習慣の定着'],
            ['ダイエット', '体重・体脂肪・消費カロリー', '減量・体組成改善'],
          ]}
        />
        <Note text="ランニング以外のタイプでは、レース設定・初期テスト・心拍ゾーン・CTL/ATLなどランニング専用の機能は自動的に非表示になります。ダイエット・運動愛好家タイプでは体重・体脂肪の推移グラフが表示されます。" />
      </Section>

      <Section id="settings-profile" title="プロフィール編集">
        <p className="text-slate-400 mb-4">設定 → プロフィール から編集します。生年月日を入力すると年齢が自動表示されます。</p>
        <Table
          headers={['項目', '対象']}
          rows={[
            ['名前・性別・生年月日（年齢自動計算）', '全員'],
            ['身長・体重', '全員'],
            ['居住地・自己紹介', '全員'],
            ['アクティビティタイプ', '選手（自己設定）'],
            ['既定アクティビティタイプ', 'コーチ（新規選手へ適用）'],
            ['LTHR（乳酸閾値心拍）', '選手・ランニング/競技タイプ'],
            ['最大心拍・安静時心拍', '選手のみ'],
            ['閾値ペース・FTP', '選手・ランニングタイプ'],
          ]}
        />
        <Note text="LTHRを設定すると5段階の心拍ゾーンが自動計算されます（ランニング・競技タイプのみ）。" />
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

          <Section id="settings-tests" title="初期テスト・フィジカルテスト">
            <p className="text-slate-400 mb-4">
              メニューの「テスト」から、コーチが指定したテストを実施して結果を記録します。テスト内容はあなたの競技・タイプに応じてコーチが設定します。結果を2回以上記録すると推移グラフが表示され、コーチも確認できます。
            </p>
            <Table
              headers={['例：テスト', '対象競技の例']}
              rows={[
                ['20分全力走 / 5kmTT / FTP', 'ランニング・耐久系（LTHR・閾値ペース等を自動計算）'],
                ['30mスプリント / 5-10-5アジリティ', 'サッカー・テニス・バスケ'],
                ['垂直跳び(CMJ) / 立ち幅跳び', '全般・パワー系'],
                ['Yo-Yo IR1 / ビープテスト', 'サッカー・持久系'],
                ['握力 / プランク / 長座体前屈', '全般（筋力・柔軟性）'],
              ]}
            />
            <Note text="コーチがテストを割り当てると「コーチ指定のテスト」として表示され、数値を入力して保存できます。割り当てが無い場合は表示されません。" />
          </Section>
        </>
      )}

      <Section id="settings-notifications" title="通知・プッシュ通知">
        <p className="text-slate-400 mb-4">
          メニュー → 通知 から、アプリ内通知の確認とプッシュ通知の有効化ができます。「通知を有効にする」をタップしてブラウザの許可を与えると、アプリを開いていなくても以下のタイミングで端末に通知が届きます。
        </p>
        <ul className="space-y-1.5 text-slate-400">
          <Li text="コーチがメニューを追加したとき" />
          <Li text="選手がワークアウト・ウェルネスを記録したとき" />
          <Li text="コーチがフィードバック（赤ペン）を書いたとき" />
          <Li text="チャットメッセージが届いたとき" />
          <Li text="誕生日（お祝いメッセージが届きます🎉）" />
        </ul>
        <Note text="プッシュ通知はホーム画面に追加（PWAインストール）して使うと、より安定して届きます。iPhoneはホーム画面に追加後に通知を有効化してください。" />
      </Section>

      {/* 管理者向け（管理者のみ） */}
      {isAdmin && (
        <>
          <div id="admin" className="pt-4">
            <RoleHeader label="管理者向け機能" color="violet" />
          </div>
          <Section id="admin-dashboard" title="管理者ダッシュボード">
            <p className="text-slate-400 mb-4">
              サイドバーの「管理者」から、全ユーザー（コーチ・選手）の情報を横断的に閲覧できます。運営者のみがアクセスできます。
            </p>
            <ul className="space-y-1.5 text-slate-400">
              <Li text="全ユーザー一覧（名前・年齢・メール・担当コーチ・タイプ・プラン・CTL/ATL/TSB）と検索" />
              <Li text="ユーザー詳細：プロフィール・集計・ワークアウト・ウェルネス・筋トレ・担当選手・AIプロフィール・招待・チャット・生データ(JSON)" />
            </ul>
            <Note text="管理者権限は users ドキュメントの isAdmin、または環境変数 ADMIN_UIDS で付与します。" />
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
          <FaqItem q="心拍ゾーンが表示されない" a="設定 → プロフィール でLTHR（乳酸閾値心拍）を設定するとゾーンが自動計算されます。メニューの「テスト」の「20分全力走テスト」で計測できます。" />
        )}
        <FaqItem q="CTL/ATLとは何ですか" a="トレーニング負荷の指標です。CTL（慢性トレーニング負荷）はフィットネスの蓄積、ATL（急性トレーニング負荷）は直近の疲労、TSB（トレーニングストレスバランス）はその差で調子を表します。Strava連携またはワークアウト記録により自動更新されます（ランニング・競技タイプで表示）。" />
        <FaqItem q="アクティビティタイプを変更したい" a="選手自身は「設定 → プロフィール → アクティビティタイプ」から、コーチは選手詳細ページの「アクティビティタイプ」から変更できます。変更すると記録項目・指標・AIメニュー・グラフが切り替わります。既存の記録は保持されます。" />
        <FaqItem q="ダイエットなのに距離やペースが出る / 体重欄がない" a="アクティビティタイプが「ダイエット」または「運動愛好家」になっているか確認してください。タイプを切り替えると、体重・体脂肪・消費カロリーの入力欄と推移グラフが表示され、ランニング専用の項目は非表示になります。" />
        <FaqItem q="プッシュ通知はアプリアイコンに数字（バッジ）で出ますか" a="通知はまずバナー／ロック画面の通知として届きます。アプリをホーム画面に追加（PWAインストール）すると、対応端末では未読件数がアイコンにバッジ表示されます。通知自体は「メニュー → 通知 → 通知を有効にする」で有効化してください。" />
        <FaqItem q="誕生日のお祝いは届きますか" a="プロフィールに生年月日を登録しておくと、誕生日当日にお祝いの通知が届きます（プッシュ通知を有効にしているとプッシュでも届きます）。" />
        {role !== 'coach' && (
          <FaqItem q="動画アップロードができない" a="コーチが招待済みであることが必要です。コーチが未設定の場合はアップロードできません。" />
        )}
      </div>

      {/* フッター */}
      <div className="mt-12 border-t border-slate-800 pt-8 text-center">
        <p className="text-sm text-slate-500">Coachpad は合同会社コアデザインが開発・運営しています。</p>
        <p className="mt-1 text-sm text-slate-500">
          お問い合わせ:{' '}
          {LINE_URL && (
            <>
              <a href={LINE_URL} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                LINE
              </a>
              {' · '}
            </>
          )}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-emerald-400 hover:underline">
            {CONTACT_EMAIL}
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
