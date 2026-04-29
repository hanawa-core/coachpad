import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'プライバシーポリシー | CoachPad',
}

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <Link
        href="/login"
        className="not-prose inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        戻る
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">プライバシーポリシー</h1>
      <p className="text-xs text-slate-500 mb-8">最終更新日：2026年4月30日</p>

      <p className="text-sm text-slate-300 leading-relaxed mb-6">
        合同会社コアデザイン（以下「当社」といいます）は、当社の提供するオンラインコーチングプラットフォーム「CoachPad」（以下「本サービス」といいます）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
      </p>

      <Section title="第1条（個人情報）">
        <p>「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。</p>
      </Section>

      <Section title="第2条（個人情報の収集方法）">
        <p>当社は、ユーザーが利用登録をする際および本サービス利用時に、以下の情報を収集することがあります。</p>
        <ol className="ml-6 list-decimal space-y-1">
          <li>氏名、メールアドレス、電話番号、住所、生年月日、性別、身長、体重</li>
          <li>プロフィール画像、自己紹介文</li>
          <li>トレーニング記録（走行距離、時間、ペース、心拍数、獲得標高、消費カロリー、TSS、トレーニング負荷指標 等）</li>
          <li>体調記録（睡眠時間、睡眠の質、疲労度、筋肉痛、気分、ストレス、安静時心拍、体重、その他のメモ）</li>
          <li>動画・画像データ（フォーム解析・赤ペン注釈用）</li>
          <li>チャットメッセージ・コーチからのフィードバック内容</li>
          <li>ターゲットレース情報（レース名・日付・距離）</li>
          <li>怪我・故障歴に関する記述</li>
          <li>テスト結果（LTHR、最大心拍、安静時心拍、閾値ペース、FTP）</li>
          <li>決済情報（決済代行業者を経由）</li>
          <li>Strava等の外部サービス連携時に取得する情報</li>
          <li>サービス利用ログ（IPアドレス、ブラウザ情報、アクセス日時、参照元ページ）</li>
        </ol>
      </Section>

      <Section title="第3条（個人情報を収集・利用する目的）">
        <p>当社が個人情報を収集・利用する目的は、以下のとおりです。</p>
        <ol className="ml-6 list-decimal space-y-1">
          <li>本サービスの提供・運営のため</li>
          <li>ユーザーからのお問い合わせに回答するため（本人確認を含む）</li>
          <li>コーチとしてのトレーニング指導・プラン設計・フィードバック提供のため</li>
          <li>ユーザーの体調・トレーニング状態に応じた個別指導の最適化のため</li>
          <li>本サービスの利用状況をユーザーにお知らせするため</li>
          <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
          <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
          <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
          <li>有料サービスにおいて、ユーザーに利用料金を請求するため</li>
          <li>本サービスの改善、新サービスの開発のための統計分析（個人を特定しない形）</li>
          <li>上記の利用目的に付随する目的</li>
        </ol>
      </Section>

      <Section title="第4条（AI（人工知能）による情報の取扱い）">
        <ol className="ml-6 list-decimal space-y-1">
          <li>当社は、トレーニングプラン作成、メニュー提案、選手状態分析等の指導補助を目的として、Anthropic, PBC社が提供するAI（Claude）に対し、ユーザーのトレーニング・体調データを送信することがあります。</li>
          <li>送信されるデータは、AIによる分析結果の生成のみに利用され、Anthropic社のモデル学習には使用されません（API利用契約に基づく）。</li>
          <li>AIによる分析結果は、コーチの指導判断を支援するための情報であり、医療診断その他の専門的判断に代替するものではありません。</li>
          <li>ユーザーは、設定画面からAI分析機能の利用を停止することができます。</li>
        </ol>
      </Section>

      <Section title="第5条（第三者への情報提供）">
        <ol className="ml-6 list-decimal space-y-1">
          <li>当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。
            <ul className="ml-6 list-disc space-y-1 mt-1">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
            </ul>
          </li>
          <li>本サービスを通じてコーチと選手の間で共有されるトレーニングデータ・体調データ・チャット内容・動画等は、当該コーチ・選手間でのみ閲覧可能とし、第三者には共有されません。</li>
          <li>当社は、本サービスの提供にあたり、以下の業務委託先に個人情報を取り扱わせることがあります。
            <ul className="ml-6 list-disc space-y-1 mt-1">
              <li>クラウドインフラ：Google LLC（Firebase / Google Cloud Storage）</li>
              <li>ホスティング：Vercel Inc.</li>
              <li>AI分析：Anthropic, PBC（Claude API）</li>
              <li>外部連携：Strava, Inc.</li>
              <li>決済代行：株式会社ツールラボ（マイスピー）</li>
            </ul>
          </li>
          <li>当社は、各業務委託先に対し、適切な個人情報保護措置を講じることを義務付けています。</li>
        </ol>
      </Section>

      <Section title="第6条（外部サービスとの連携）">
        <ol className="ml-6 list-decimal space-y-1">
          <li>本サービスはStrava, Inc. が提供するStrava APIと連携し、ユーザーの同意のもとでStravaに記録されたアクティビティ情報（走行距離、時間、ペース、心拍、地図経路等）を取得します。</li>
          <li>Strava連携の解除はいつでもユーザー自身で行うことができます。解除後は、Strava側のアクセストークンが無効化され、新規データの取得は停止します。</li>
          <li>Stravaから取得したデータの取扱いには、当社のプライバシーポリシーに加え、<a href="https://www.strava.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Stravaのプライバシーポリシー</a>も適用されます。</li>
        </ol>
      </Section>

      <Section title="第7条（個人情報の訂正および削除）">
        <ol className="ml-6 list-decimal space-y-1">
          <li>ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除（以下「訂正等」といいます）を請求することができます。</li>
          <li>当社は、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。</li>
          <li>当社は、前項の規定に基づき訂正等を行った場合、または訂正等を行わない旨の決定をしたときは遅滞なく、これをユーザーに通知します。</li>
        </ol>
      </Section>

      <Section title="第8条（個人情報の利用停止等）">
        <ol className="ml-6 list-decimal space-y-1">
          <li>当社は、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」といいます）を求められた場合には、遅滞なく必要な調査を行います。</li>
          <li>前項の調査結果に基づき、その請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の利用停止等を行います。</li>
          <li>当社は、前項の規定に基づき利用停止等を行った場合、または利用停止等を行わない旨の決定をしたときは、遅滞なく、これをユーザーに通知します。</li>
        </ol>
      </Section>

      <Section title="第9条（データの保存期間）">
        <ol className="ml-6 list-decimal space-y-1">
          <li>ユーザーが本サービスを退会した場合、当社は当該ユーザーの個人情報を法令で定められた期間保管した後、合理的な期間内に削除します。</li>
          <li>ただし、退会後も、本サービスの不正利用防止、紛争解決等の正当な目的のために必要な範囲で、一部の情報を保管することがあります。</li>
        </ol>
      </Section>

      <Section title="第10条（Cookieの使用について）">
        <ol className="ml-6 list-decimal space-y-1">
          <li>本サービスは、ユーザー認証・セッション管理のためにCookieを使用します。</li>
          <li>ブラウザの設定によりCookieを無効にすることができますが、その場合本サービスの一部機能が利用できなくなることがあります。</li>
          <li>本サービスは、利用状況の分析のために第三者提供のアクセス解析ツールを使用することがあります。これらのツールは個人を特定しない形式で情報を収集します。</li>
        </ol>
      </Section>

      <Section title="第11条（セキュリティ）">
        <p>当社は、個人情報の漏えい、滅失または毀損の防止その他の個人情報の安全管理のため、必要かつ適切な措置を講じます。具体的には以下の対策を実施しています。</p>
        <ol className="ml-6 list-decimal space-y-1">
          <li>SSL/TLSによる通信の暗号化</li>
          <li>Firebase Authentication によるパスワードのハッシュ化保存</li>
          <li>アクセス制御（Firestoreセキュリティルール、Storage セキュリティルール）による不正アクセス防止</li>
          <li>定期的なセキュリティレビューと脆弱性対策</li>
        </ol>
      </Section>

      <Section title="第12条（未成年者のご利用について）">
        <ol className="ml-6 list-decimal space-y-1">
          <li>本サービスは原則として満18歳以上の方を対象としています。</li>
          <li>未成年者が本サービスを利用する場合は、必ず保護者の同意を得たうえでご利用ください。</li>
        </ol>
      </Section>

      <Section title="第13条（プライバシーポリシーの変更）">
        <ol className="ml-6 list-decimal space-y-1">
          <li>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。</li>
          <li>当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。</li>
        </ol>
      </Section>

      <Section title="第14条（お問い合わせ窓口）">
        <p>本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。</p>
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm">
          <p className="font-semibold text-white">合同会社コアデザイン</p>
          <p className="mt-1">個人情報保護管理者：塙 翔太</p>
          <p>Eメール：s.hanawa@coredesign-athlete.com</p>
        </div>
      </Section>

      <div className="mt-12 border-t border-slate-800 pt-6 text-sm text-slate-400">
        <p>合同会社コアデザイン</p>
        <p className="mt-2">以上</p>
      </div>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold text-white mt-6 mb-2">{title}</h2>
      <div className="text-sm text-slate-300 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}
