import React, { useState } from "react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";

import SearchBar from "@/features/search/components/SearchBar";
import CategoryItems from "@/features/category/pages/CategoryItems";

import {
  IconSpy, IconShieldLock, IconCalendar, IconInfoCircle, IconUserCircle, IconListDetails,
  IconMapPin, IconDevices, IconMessages, IconReceipt, IconUsers, IconCookie,
  IconLock, IconUserCheck, IconBabyCarriage, IconRefresh, IconMail, IconEyeOff,
  IconTrash, IconAlertTriangle, IconChevronRight, IconShieldCheck, IconKey,
  IconServer, IconRadar, IconHandStop, IconCreditCard, IconBellRinging,
  IconChartBar, IconGavel, IconHeadset, IconDatabase, IconEye, IconShare,
  IconFlag, IconBuildingStore, IconHome, IconPencil, IconBan, IconSettings,
  IconSparkles, IconRobot, IconMessageChatbot, IconPhoto, IconShoppingCart,
  IconTruckDelivery, IconWallet, IconCrown, IconStar, IconLogout,
  IconMessageReport, IconBrandStripe, IconBrandGoogle, IconCloud, IconUserOff,
  IconFileDescription,
} from "@tabler/icons-react";

/* ───────── reusable pieces (Bootstrap 5.3 classes) ───────── */

const Card = ({ className = "", children }) => (
  <div className={`border rounded-3 bg-white ${className}`}>{children}</div>
);

const IconBox = ({ icon: Icon, size = 20, small, dark, className = "" }) => (
  <span
    className={`pp-icon ${small ? "pp-icon-sm" : ""} ${dark ? "pp-icon-dark" : ""} d-inline-flex align-items-center justify-content-center rounded-2 ${className}`}
  >
    <Icon size={size} stroke={1.75} />
  </span>
);

const Note = ({ icon: Icon = IconInfoCircle, warn, children }) => (
  <div
    className={`d-flex align-items-start gap-3 rounded-2 border-start border-3 p-3 my-3 small ${
      warn
        ? "bg-warning-subtle border-warning text-warning-emphasis"
        : "bg-light pp-border-ink pp-ink"
    }`}
  >
    <Icon size={20} stroke={1.75} className="flex-shrink-0 mt-1" />
    <div>{children}</div>
  </div>
);

const Rows = ({ items }) => (
  <Card className="px-3 px-md-4 my-3">
    {items.map(([Icon, title, desc], i) => (
      <div
        key={title}
        className={`d-flex gap-3 py-3 ${i < items.length - 1 ? "border-bottom" : ""}`}
      >
        <IconBox icon={Icon} />
        <div>
          <h4 className="fs-6 fw-semibold mb-1">{title}</h4>
          <p className="small mb-0">{desc}</p>
        </div>
      </div>
    ))}
  </Card>
);

const DataTable = () => {
  const rows = [
    [IconUserCircle, "Account", "Name, email, phone number, profile photo, hashed password, or name/email/photo from Google if you sign in with Google", "Sign up, login, identity, account management"],
    [IconListDetails, "Listings", "Title, price, description, category, condition, photos, and the country, city and address you enter", "Publish and manage your ads and products"],
    [IconMapPin, "Location", "Country, city and address that you select or type yourself", "Show relevant local listings and deliver orders"],
    [IconShoppingCart, "Orders", "Items, quantity, shipping address, payment method (COD or Stripe), order status", "Process, deliver and track your orders"],
    [IconWallet, "Wallet & plans", "Wallet balance, transactions, withdrawal requests, subscription and featured-ad purchases", "Pay sellers, handle withdrawals, apply plan limits"],
    [IconMessages, "Messages", "Chat with sellers or admin, and chats you report", "Communication, dispute resolution and support"],
    [IconFileDescription, "Support & reports", "Contact form name, email, subject, message, optional image; reports you file", "Support replies and community safety"],
    [IconDevices, "Device & usage", "IP address, browser, OS, login sessions", "Security monitoring and keeping you signed in"],
  ];
  return (
    <Card className="overflow-hidden my-3">
      <div className="table-responsive">
        <table className="table align-top text-start small mb-0">
          <thead className="table-light">
            <tr>
              {["Category", "Examples", "Purpose"].map((h) => (
                <th key={h} className="fw-semibold text-secondary text-start py-3 px-3 border-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([Icon, cat, ex, pur]) => (
              <tr key={cat}>
                <td className="px-3 py-3 fw-semibold text-nowrap text-start">
                  <span className="d-inline-flex align-items-start justify-content-start text-start gap-2">
                    <IconBox icon={Icon} size={16} small />
                    <span className="pt-1">{cat}</span>
                  </span>
                </td>
                <td className="px-3 py-3 text-secondary text-start">{ex}</td>
                <td className="px-3 py-3 text-secondary text-start">{pur}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const RightsGrid = () => {
  const rights = [
    [IconEye, "Access your data"], [IconPencil, "Correct inaccuracies"], [IconTrash, "Request deletion"],
    [IconHandStop, "Withdraw consent"], [IconBellRinging, "Control notifications"], [IconLogout, "Log out of all devices"],
    [IconFlag, "Lodge a complaint"],
  ];
  return (
    <div className="d-flex flex-wrap gap-2 my-3">
      {rights.map(([Icon, r]) => (
        <span key={r} className="border rounded-3 bg-white d-inline-flex align-items-center gap-2 px-3 py-2 small">
          <Icon size={18} stroke={1.75} />
          {r}
        </span>
      ))}
    </div>
  );
};

const ContactGrid = ({ items }) => (
  <div className="row g-3 mt-1">
    {items.map(({ icon, type, val, desc }) => (
      <div key={type} className="col-12 col-md-4">
        <Card className="p-3 h-100">
          <IconBox icon={icon} className="mb-3" />
          <p className="text-secondary small mb-1">{type}</p>
          {val.includes("@") ? (
            <a href={`mailto:${val}`} className="fw-semibold text-decoration-none pp-ink d-block mb-2 text-break">
              {val}
            </a>
          ) : (
            <span className="fw-semibold pp-ink d-block mb-2">{val}</span>
          )}
          <p className="text-secondary small mb-0">{desc}</p>
        </Card>
      </div>
    ))}
  </div>
);

const Mail = ({ children }) => (
  <a href={`mailto:${children}`} className="fw-semibold pp-ink">{children}</a>
);

/* ───────── sections ───────── */

const sections = [
  {
    title: "Introduction", icon: IconInfoCircle, group: 0,
    content: (
      <>
        <p>DealSphere is an online marketplace based in Pakistan where people post ads, sell products, and buy directly from sellers in their own cities. You can chat with sellers, order products with cash on delivery or online payment, and sellers can grow with subscriptions and featured listings.</p>
        <p>This policy explains what personal information we collect, how we use it, who we share it with, and how we protect it. By creating an account or browsing DealSphere, you agree to the practices described here.</p>
        <Note icon={IconShieldCheck}>Our core promise: we do not sell, rent, or share your personal information with advertisers or data brokers. What you share on DealSphere stays on DealSphere.</Note>
        <p>Questions or data requests? Write to <Mail>privacy@dealsphere.pk</Mail>.</p>
      </>
    ),
  },
  {
    title: "Info we collect", icon: IconDatabase, group: 0,
    content: (
      <>
        <p>We only collect what is needed to help you buy and sell safely. Here is what we gather:</p>
        <DataTable />
        <Note icon={IconCreditCard}>We never store full payment card numbers. Online payments are handled by Stripe.</Note>
      </>
    ),
  },
  {
    title: "How we use it", icon: IconSettings, group: 0,
    content: (
      <>
        <p>Every piece of information is used for a specific, legitimate reason:</p>
        <Rows items={[
          [IconUserCircle, "Account management", "Create and maintain your profile, verify your email with a one-time code, and keep your account secure."],
          [IconListDetails, "Listings", "Publish your ads and products, show them to relevant buyers, and help you manage them."],
          [IconTruckDelivery, "Orders and delivery", "Pass the details needed to deliver your order to the seller, and show order status to both sides."],
          [IconWallet, "Payments and wallet", "Record transactions, credit seller earnings, and process withdrawal requests."],
          [IconMessages, "Communication", "Power the in-app chat so you can negotiate, ask questions, and close deals."],
          [IconRadar, "Trust and safety", "Detect fake listings, scam accounts, and suspicious activity, and act on reports."],
          [IconBellRinging, "Notifications", "Send email and in-app alerts about messages, orders, listings, and account updates."],
          [IconHeadset, "Customer support", "Answer contact requests, resolve disputes, and fix account issues."],
          [IconChartBar, "Platform improvement", "Understand which features work well and where we can do better."],
          [IconGavel, "Legal compliance", "Meet our obligations under applicable Pakistani law."],
        ]} />
        <Note>You can turn off non-essential notifications from your account settings at any time.</Note>
      </>
    ),
  },
  {
    title: "AI features", icon: IconSparkles, group: 0,
    content: (
      <>
        <p>DealSphere uses AI to make selling and searching faster. AI only receives what a feature needs to work, and its output is a suggestion for you to review.</p>
        <Rows items={[
          [IconRobot, "Product autofill", "When you use autofill, your description and up to 3 photos are sent to Google's Gemini to draft a title, description, category, condition, and estimated price. You can edit everything before publishing."],
          [IconPhoto, "Poster creation", "Your product photo is placed onto a promotional poster design on our own servers. It is not turned into an AI-generated image."],
          [IconMessageChatbot, "Chat assistant", "Questions you ask the assistant about listings are processed by AI so it can reply in real time."],
          [IconShieldCheck, "Listing checks", "New listings may be reviewed by AI, along with basic account history such as account age and past ads, to decide whether to approve, hold, or reject them."],
        ]} />
        <Note icon={IconAlertTriangle} warn>Avoid putting sensitive personal details, such as ID numbers or home addresses, into descriptions or assistant questions.</Note>
      </>
    ),
  },
  {
    title: "Orders & payments", icon: IconReceipt, group: 0,
    content: (
      <>
        <p>Besides classified ads, you can buy products directly through a cart or the Buy Now button.</p>
        <Rows items={[
          [IconShoppingCart, "Orders", "We store the items, quantity, shipping address, and payment method for each order. The seller sees your name, phone, and address only to deliver it."],
          [IconBrandStripe, "Online payments", "Stripe processes card payments. We keep the payment reference and status, never your full card number. With cash on delivery, no online payment data is collected."],
          [IconWallet, "Wallet and withdrawals", "After a buyer confirms receipt, the seller's earnings are credited to their wallet. We keep wallet balance, transaction history, and withdrawal requests for accounting and support."],
          [IconCrown, "Subscriptions", "Seller plans (free, monthly, yearly) and their purchase records are kept so we can apply listing limits and expiry dates."],
          [IconStar, "Featured listings", "Featured-ad purchases and their start and end dates are kept so we can show and expire them correctly."],
        ]} />
        <Note icon={IconCreditCard}>Payment and transaction records may be kept after account deletion where needed for legal, accounting, or dispute purposes.</Note>
      </>
    ),
  },
  {
    title: "Sharing your data", icon: IconShare, group: 1,
    content: (
      <>
        <p>We do not sell your data. We share specific information only in these limited situations:</p>
        <Rows items={[
          [IconUsers, "Other users", "When you post a listing, your display name, listing details, and general area are visible to others. Your phone number is not shown publicly unless you add it to a listing."],
          [IconTruckDelivery, "Sellers you buy from", "Your name, phone number, and shipping address are shared with the seller to fulfil your order."],
          [IconBrandStripe, "Stripe", "Processes online payments and handles card details on our behalf."],
          [IconCloud, "Cloudinary", "Stores photos you upload, such as profile pictures, listing images, and contact attachments."],
          [IconMail, "Brevo", "Delivers our emails, such as verification codes, password resets, and order or support updates."],
          [IconBrandGoogle, "Google", "Provides Google sign-in if you choose it, and Gemini for the AI features described above."],
          [IconGavel, "Legal authorities", "If required by a court order, government authority, or law, for example to investigate fraud or protect user safety."],
          [IconBuildingStore, "Business transfers", "If DealSphere is ever acquired or merged, your data may transfer to the new entity under the same protections."],
        ]} />
        <p>These providers may only use your data to deliver their service to us.</p>
        <Note icon={IconAlertTriangle} warn>We will tell you about any government data request unless we are legally prohibited from doing so.</Note>
      </>
    ),
  },
  {
    title: "Cookies & sessions", icon: IconCookie, group: 1,
    content: (
      <>
        <p>We use only the cookies needed to keep you signed in and the platform secure.</p>
        <Rows items={[
          [IconLock, "Login cookies", "Access and refresh tokens are stored in httpOnly cookies, which scripts in your browser cannot read."],
          [IconDevices, "Sessions", "Each login creates a session. The refresh token is stored in hashed form, and you can log out of all devices from your account settings."],
          [IconBrandGoogle, "Google sign-in", "If you use it, Google shares your name, email, and profile photo with us to create or open your account."],
        ]} />
        <p>You can manage or clear cookies from your browser settings, but you will be signed out and some features will stop working.</p>
        <Note icon={IconEyeOff}>We do not use third-party advertising cookies and do not sell your browsing behaviour to any advertiser.</Note>
      </>
    ),
  },
  {
    title: "Data security", icon: IconLock, group: 1,
    content: (
      <>
        <p>We use several layers of protection to keep your data safe from unauthorized access, loss, or misuse.</p>
        <Rows items={[
          [IconLock, "Encryption in transit", "Data between your device and our servers is protected with TLS."],
          [IconKey, "Password protection", "Passwords are hashed and never stored in plain text. Email verification and password resets use one-time codes."],
          [IconServer, "Access controls", "Accounts have roles (guest, seller, admin), and admin tools are available only to authorized staff."],
          [IconRadar, "Abuse prevention", "Rate limits, listing checks, and report reviews help us catch spam, fake listings, and scams."],
          [IconLogout, "Session control", "You can end all active sessions at any time from your account settings."],
        ]} />
        <Note icon={IconAlertTriangle} warn>If you suspect your account is compromised, contact <Mail>security@dealsphere.pk</Mail> immediately.</Note>
      </>
    ),
  },
  {
    title: "Reports & moderation", icon: IconMessageReport, group: 1,
    content: (
      <>
        <p>To keep the marketplace trustworthy, we keep some records about reports, support requests, and account actions.</p>
        <Rows items={[
          [IconFlag, "Reports", "You can report an ad, product, seller, or chat. We store the report and reason. For chat reports we also keep the related conversation so an admin can review it."],
          [IconUserOff, "Account actions", "If an account is warned, suspended, or banned, we record the reason, date, and duration, notify the user by email and in-app, and may hide the seller's listings."],
          [IconHeadset, "Support requests", "Contact form messages, from users or guests, are kept with our replies so we can help you and keep a support history."],
        ]} />
        <Note icon={IconEyeOff}>Admins open a private chat only when it is reported or when you contact them directly.</Note>
      </>
    ),
  },
  {
    title: "Your rights", icon: IconUserCheck, group: 2,
    content: (
      <>
        <p>You have control over your personal data. These rights are available to you:</p>
        <RightsGrid />
        <p>You can edit your profile and end sessions from account settings. For anything else, email <Mail>privacy@dealsphere.pk</Mail>. We respond to verified requests within 30 days.</p>
        <Note icon={IconShieldCheck}>We never penalize you for exercising your data rights. Deleting your account removes your profile and listings, except records we must keep for legal, accounting, or dispute reasons.</Note>
      </>
    ),
  },
  {
    title: "Minors", icon: IconBabyCarriage, group: 2,
    content: (
      <>
        <p>DealSphere is designed for adults only. Our services are not directed at anyone under 18.</p>
        <p>We do not knowingly collect personal information from minors. If we find an account belonging to a user under 18, we will delete it and its associated data.</p>
        <p>Parents or guardians who believe their child has signed up can contact <Mail>privacy@dealsphere.pk</Mail> right away.</p>
        <Note icon={IconBan}>We encourage parents to monitor their children's online activity and use parental controls on shared devices.</Note>
      </>
    ),
  },
  {
    title: "Policy changes", icon: IconRefresh, group: 2,
    content: (
      <>
        <p>As DealSphere grows, this policy may be updated to reflect new features, legal requirements, or better data practices.</p>
        <p>For significant changes, we will email you and show a notice on the platform at least 7 days before they take effect. The "Last updated" date at the top of this page always shows the latest version.</p>
        <p>Continuing to use DealSphere after an update means you accept the revised terms. If you disagree, you can stop using the platform and request account deletion.</p>
        <Note icon={IconCalendar}>We recommend reviewing this page from time to time to stay informed about how we handle your data.</Note>
      </>
    ),
  },
  {
    title: "Contact us", icon: IconMail, group: 2,
    content: (
      <>
        <p>Have a privacy question, data request, or something to report? Pick the right channel and we will reply within 5 business days.</p>
        <ContactGrid items={[
          { icon: IconShieldLock, type: "Privacy inquiries", val: "privacy@dealsphere.pk", desc: "Data access, correction, or deletion requests and general privacy questions." },
          { icon: IconAlertTriangle, type: "Security issues", val: "security@dealsphere.pk", desc: "Report a compromised account, vulnerability, or suspected breach." },
          { icon: IconMapPin, type: "Office location", val: "Lahore, Pakistan", desc: "DealSphere Pvt. Ltd., DHA Phase 6, Lahore." },
        ]} />
      </>
    ),
  },
];

const commitments = [
  { icon: IconDatabase, title: "Data minimization", desc: "We only collect what is necessary to run the marketplace. No bulk harvesting, no unnecessary tracking." },
  { icon: IconLock, title: "Secure by default", desc: "Traffic is encrypted, passwords are hashed, and login cookies are httpOnly." },
  { icon: IconEye, title: "Full transparency", desc: "We tell you what data we collect, why, and who we share it with. No fine print surprises." },
  { icon: IconUserCheck, title: "You stay in control", desc: "Edit your profile, end sessions, or request deletion whenever you want." },
];

const promises = [
  { icon: IconDatabase, title: "Sell your data", desc: "We never sell personal information to advertisers, data brokers, or any outside party." },
  { icon: IconRadar, title: "Use advertising trackers", desc: "We do not use third-party advertising cookies or sell your browsing behaviour." },
  { icon: IconMessages, title: "Read private chats", desc: "Admins open a chat only when it is reported or you contact them directly." },
  { icon: IconCreditCard, title: "Store your card number", desc: "Stripe handles card payments. We never see or store your full card details." },
  { icon: IconGavel, title: "Share with governments silently", desc: "We notify you of any government data request unless legally prohibited." },
  { icon: IconBabyCarriage, title: "Collect data from minors", desc: "We do not knowingly collect or process information from anyone under 18." },
];

const navGroupLabels = ["Your data", "Sharing & safety", "Rights & help"];

/* ───────── page ───────── */

const PrivacyPolicy = () => {
  const [active, setActive] = useState(0);
  const Current = sections[active];

  return (
    <div className="privacy-policy-section overflow-hidden">
      <Navbar />

      <div className="container-fluid d-flex flex-wrap flex-md-nowrap align-items-center mx-lg-2 py-1 mb-2">
        <SearchBar
          type="ads"
          searchPath="/advertisement"
          wrapperClassName="col-md-5 col-lg-4 me-md-2"
        />
        <CategoryItems />
      </div>

      <div className="bg-white pp-ink">
        {/* HERO */}
        <div className="pp-hero row mx-0 px-3 px-md-5 py-5 align-items-center">
          <div className="col-12 col-md-8 mb-4 mb-md-0">
            <p className="d-flex align-items-center gap-1 mb-3 small text-white-50">
              <IconHome size={15} /> Home <IconChevronRight size={13} /> Legal <IconChevronRight size={13} /> Privacy policy
            </p>
            <h1 className="fw-bold text-white mb-3 display-5">
              How DealSphere handles your information
            </h1>
            <p className="mb-4 text-white-50 col-lg-8">
              Understand how we collect, store, and protect your data so buying and selling on our platform stays safe, secure, and transparent.
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <span className="pp-badge"><IconShieldCheck size={15} /> Protected</span>
              <span className="pp-badge"><IconLock size={15} /> Secure</span>
              <span className="pp-badge"><IconEye size={15} /> Transparent</span>
              <span className="pp-badge"><IconCalendar size={15} /> Last updated: April 10, 2026</span>
            </div>
          </div>
          <div className="col-12 col-md-4 d-flex justify-content-center justify-content-md-end">
            <div
              className="rounded-circle bg-white d-flex align-items-center justify-content-center border border-5 border-secondary-subtle"
              style={{ width: 160, height: 160 }}
            >
              <IconSpy className="pp-ink" size={100} stroke={1.5} />
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="row mx-0 px-2 px-md-5 py-4">
          <nav className="col-12 col-lg-3 pe-lg-4 mb-3 mb-lg-0" aria-label="Privacy policy sections">
            <div className="pp-nav d-flex flex-lg-column gap-1 overflow-auto pb-2 pb-lg-0">
              {navGroupLabels.map((label, g) => (
                <React.Fragment key={label}>
                  <p className="d-none d-lg-block text-secondary fw-semibold px-3 mb-1 mt-3 small">{label}</p>
                  {sections.map((s, idx) =>
                    s.group === g ? (
                      <button
                        key={s.title}
                        type="button"
                        onClick={() => setActive(idx)}
                        className={`pp-nav-btn btn btn-sm text-start d-flex align-items-center gap-2 py-2 px-3 ${
                          active === idx ? "pp-active fw-semibold" : "text-secondary border-0"
                        }`}
                        aria-current={active === idx ? "page" : undefined}
                      >
                        <s.icon size={18} stroke={1.75} />
                        {s.title}
                      </button>
                    ) : null
                  )}
                </React.Fragment>
              ))}
            </div>
          </nav>

          <div className="col-12 col-lg-9">
            <Card className="p-4 p-lg-5">
              <div className="d-flex align-items-center gap-3 border-bottom pb-3 mb-4">
                <IconBox icon={Current.icon} size={22} />
                <h2 className="fw-semibold mb-0 fs-4">{Current.title}</h2>
              </div>
              <div className="pp-body pp-fade" key={active}>{Current.content}</div>
            </Card>
          </div>
        </div>

        {/* COMMITMENTS */}
        <div className="px-3 px-md-5 py-5 bg-light">
          <h2 className="fw-semibold mb-1 fs-4">Our privacy commitments</h2>
          <p className="text-secondary mb-4 col-lg-6">
            The principles we follow every day, whether you are a buyer, a seller, or just browsing.
          </p>
          <div className="row g-3">
            {commitments.map(({ icon, title, desc }) => (
              <div key={title} className="col-12 col-sm-6 col-lg-3">
                <Card className="p-3 h-100">
                  <IconBox icon={icon} className="mb-3" />
                  <h3 className="fw-semibold mb-2 fs-6">{title}</h3>
                  <p className="text-secondary small mb-0">{desc}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* WHAT WE NEVER DO */}
        <div className="px-3 px-md-5 py-5">
          <h2 className="fw-semibold mb-1 fs-4">What we never do</h2>
          <p className="text-secondary mb-4 col-lg-6">
            Clear promises about how your data will never be used on DealSphere.
          </p>
          <div className="row g-3">
            {promises.map(({ icon, title, desc }) => (
              <div key={title} className="col-12 col-sm-6 col-lg-4">
                <Card className="p-3 h-100 d-flex flex-row gap-3">
                  <IconBox icon={icon} dark />
                  <div>
                    <p className="fw-semibold mb-1">We never {title.toLowerCase()}</p>
                    <p className="text-secondary small mb-0">{desc}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* CONTACT */}
        <div className="px-3 px-md-5 pb-5">
          <h2 className="fw-semibold mb-1 fs-4">Have a concern? Reach the right team</h2>
          <p className="text-secondary mb-4 col-lg-6">
            We take every report seriously and respond within 5 business days.
          </p>
          <ContactGrid items={[
            { icon: IconShieldLock, type: "Data & privacy", val: "privacy@dealsphere.pk", desc: "Access requests, corrections, deletions, and general privacy questions." },
            { icon: IconAlertTriangle, type: "Security breach", val: "security@dealsphere.pk", desc: "Compromised accounts, vulnerabilities, or suspected unauthorized access." },
            { icon: IconFlag, type: "Scam or abuse", val: "trust@dealsphere.pk", desc: "Fake listings, fraudulent sellers, or any activity that puts buyers at risk." },
          ]} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;