'use client';

import { useEffect, useState } from 'react';
import {
  BadgeDollarSign,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Heart,
  Info,
  Leaf,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  Tag,
} from 'lucide-react';
import fallbackProducts from '@/data/products.json';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  completeStudySession,
  createStudySession,
  loadProducts,
  recordEvent,
  type Condition,
  type Product,
  type ProductKind,
  type StudyMode,
} from '@/lib/research-api';

const initialProducts = fallbackProducts as Product[];

function money(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100);
}

function savings(product: Product) {
  return product.originalPriceCents - product.currentPriceCents;
}

function savingsPercent(product: Product) {
  return Math.round((savings(product) / product.originalPriceCents) * 100);
}

function productStateKey(productId: string, kind: ProductKind) {
  return `${productId}::${kind}`;
}

function ProductCard({
  product,
  condition,
  kind,
  onDetails,
  onChoose,
  onSave,
  chosen,
  saved,
}: {
  product: Product;
  condition: Condition;
  kind: 'standard' | 'imperfect';
  onDetails: () => void;
  onChoose: () => void;
  onSave: () => void;
  chosen: boolean;
  saved: boolean;
}) {
  const enhanced = kind === 'imperfect' && condition === 'B';
  const price =
    kind === 'standard'
      ? product.originalPriceCents
      : product.currentPriceCents;
  const name =
    kind === 'standard'
      ? product.standardName
      : enhanced
        ? product.imperfectName
        : product.standardName;

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-[26px] border bg-white shadow-[0_12px_35px_rgba(22,62,42,0.07)] transition ${
        chosen
          ? 'border-[#1b7f3a] ring-4 ring-[#1b7f3a]/15'
          : 'border-[#dbe2dc]'
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f3f1e9]">
        <img
          src={
            kind === 'standard' ? product.standardImage : product.imperfectImage
          }
          alt={name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
        />
        {enhanced ? (
          <span className="absolute left-4 top-4 rounded-full bg-[#fff2a8] px-3 py-1.5 text-xs font-extrabold text-[#493e00] shadow-sm">
            Fresh value pick
          </span>
        ) : kind === 'standard' ? (
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#385848] shadow-sm">
            Standard range
          </span>
        ) : null}
        <button
          onClick={onSave}
          aria-pressed={saved}
          className={`absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/95 shadow-sm transition hover:scale-105 ${saved ? 'text-[#c8432c] ring-2 ring-[#c8432c]/20' : 'text-[#315643]'}`}
          aria-label={`${saved ? 'Remove' : 'Save'} ${name} ${saved ? 'from' : 'to'} saved products`}
        >
          <Heart className="size-4" fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#60746a]">
          {product.category}
        </p>
        <h3 className="mt-1 min-h-14 text-xl font-extrabold leading-7 tracking-[-0.02em]">
          {name}
        </h3>
        <p className="mt-1 text-sm text-[#69776f]">{product.unit}</p>

        <div className="mt-5 flex min-h-12 items-end gap-3 border-b border-[#e7ebe7] pb-4">
          <span
            className={`text-3xl font-black tracking-[-0.04em] ${kind === 'imperfect' ? 'text-[#c8432c]' : 'text-[#18322a]'}`}
          >
            {money(price)}
          </span>
          {enhanced && (
            <span className="pb-1 text-sm text-[#6c756f] line-through">
              was {money(product.originalPriceCents)}
            </span>
          )}
        </div>

        {enhanced ? (
          <div className="mt-4 rounded-2xl bg-[#edf7ef] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-[#116b34]">
                Save {money(savings(product))}
              </p>
              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-[#116b34]">
                {savingsPercent(product)}% less
              </span>
            </div>
            <p className="mt-2 text-sm leading-5 text-[#3d5b49]">
              {product.quality}
            </p>
          </div>
        ) : (
          <div className="mt-4 min-h-[92px] rounded-2xl border border-[#e4e9e5] bg-[#fafbf9] p-4">
            <p className="text-sm font-semibold text-[#385848]">
              {kind === 'standard'
                ? 'Everyday fresh produce'
                : 'Product information'}
            </p>
            <p className="mt-2 text-sm text-[#69776f]">
              Price shown for {product.unit}.
            </p>
          </div>
        )}

        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-5">
          <Button
            onClick={onChoose}
            aria-pressed={chosen}
            className={`h-11 rounded-xl text-base font-bold ${chosen ? 'bg-[#0d5c2d]' : 'bg-[#1b7f3a] hover:bg-[#12692f]'}`}
          >
            {chosen ? (
              <Check aria-hidden="true" />
            ) : (
              <ShoppingCart aria-hidden="true" />
            )}
            {chosen ? 'Selected' : 'Choose'}
          </Button>
          <Button
            onClick={onDetails}
            variant="outline"
            className="h-11 rounded-xl border-[#9fb1a5] px-4 font-bold text-[#28523c]"
          >
            Details
          </Button>
        </div>
      </div>
    </article>
  );
}

function ProductDetail({
  product,
  condition,
  kind,
}: {
  product: Product;
  condition: Condition;
  kind: 'standard' | 'imperfect';
}) {
  const enhanced = kind === 'imperfect' && condition === 'B';
  const name =
    kind === 'standard'
      ? product.standardName
      : enhanced
        ? product.imperfectName
        : product.standardName;
  const price =
    kind === 'standard'
      ? product.originalPriceCents
      : product.currentPriceCents;

  return (
    <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
      <div className="overflow-hidden rounded-2xl bg-[#f5f2ea]">
        <img
          src={
            kind === 'standard' ? product.standardImage : product.imperfectImage
          }
          alt={name}
          className="aspect-square h-full w-full object-cover"
        />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#66786e]">
          {product.category}
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#18322a]">
          {name}
        </h2>
        <p className="mt-2 text-sm text-[#68786f]">{product.unit}</p>

        <div className="mt-5 flex items-end gap-3">
          <span
            className={`text-4xl font-black tracking-[-0.05em] ${kind === 'imperfect' ? 'text-[#c8432c]' : 'text-[#18322a]'}`}
          >
            {money(price)}
          </span>
          {enhanced && (
            <span className="pb-1 text-sm text-[#6c756f] line-through">
              was {money(product.originalPriceCents)}
            </span>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-[#dfe7e1] bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            <Info
              className="mt-0.5 size-5 shrink-0 text-[#356b4a]"
              aria-hidden="true"
            />
            <div>
              <h3 className="font-extrabold text-[#183f2c]">
                Product information
              </h3>
              <p className="mt-1 text-sm leading-6 text-[#52645a]">
                {condition === 'A'
                  ? product.conditionAInformation
                  : product.conditionBInformation}
              </p>
            </div>
          </div>
        </div>

        {enhanced && (
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-[#d6eadb] bg-[#f0f8f1] p-4">
              <div className="flex gap-3">
                <Sprout
                  className="mt-0.5 size-5 shrink-0 text-[#1b7f3a]"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-extrabold text-[#164c2f]">
                    Why it looks different
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#405c4d]">
                    {product.appearance}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#d6eadb] bg-[#f0f8f1] p-4">
              <div className="flex gap-3">
                <ShieldCheck
                  className="mt-0.5 size-5 shrink-0 text-[#1b7f3a]"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-extrabold text-[#164c2f]">
                    Quality status
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#405c4d]">
                    {product.quality}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-[#efd558] bg-[#fff8cf] p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <BadgeDollarSign
                    className="size-5 shrink-0 text-[#6b5900]"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-extrabold text-[#504300]">
                      Your saving
                    </h3>
                    <p className="mt-0.5 text-sm text-[#695c1c]">
                      Compared with the standard range
                    </p>
                  </div>
                </div>
                <strong className="whitespace-nowrap text-xl text-[#504300]">
                  {money(savings(product))}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [dataSource, setDataSource] = useState<
    'loading' | 'database' | 'fallback'
  >('loading');
  const [condition, setCondition] = useState<Condition>('B');
  const [participantCondition, setParticipantCondition] =
    useState<Condition | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [activeParticipantName, setActiveParticipantName] = useState('');
  const [testStarted, setTestStarted] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [studyMode] = useState<StudyMode>('browse');
  const [selected, setSelected] = useState<{
    product: Product;
    kind: 'standard' | 'imperfect';
  } | null>(null);
  const [chosenKeys, setChosenKeys] = useState<string[]>([]);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startingSession, setStartingSession] = useState(false);
  const [recordingError, setRecordingError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadProducts(controller.signal)
      .then((databaseProducts) => {
        if (databaseProducts.length > 0) {
          setProducts(databaseProducts);
          setDataSource('database');
        } else {
          setDataSource('fallback');
        }
      })
      .catch(() => setDataSource('fallback'));

    return () => controller.abort();
  }, []);

  function resetSession() {
    setSelected(null);
    setChosenKeys([]);
    setSavedKeys([]);
    setShowSavedOnly(false);
    setCompleted(false);
    setStartedAt(null);
    setSessionId(null);
    setRecordingError(false);
    setParticipantName('');
    setParticipantCondition(null);
    setActiveParticipantName('');
    setTestStarted(false);
    setStartError(null);
    window.history.replaceState({}, '', window.location.pathname);
  }

  function elapsedMs() {
    return startedAt ? Math.max(0, Date.now() - startedAt) : undefined;
  }

  function logInteraction(
    eventType: 'product_details_opened' | 'product_chosen',
    product: Product,
    kind: ProductKind,
  ) {
    if (!sessionId) return;
    void recordEvent(sessionId, {
      eventType,
      productId: product.id,
      productKind: kind,
      elapsedMs: elapsedMs(),
      metadata: { condition, studyMode, displayScope: 'all-products' },
    }).catch(() => setRecordingError(true));
  }

  function openDetails(product: Product, kind: ProductKind) {
    setSelected({ product, kind });
    logInteraction('product_details_opened', product, kind);
  }

  function chooseProduct(product: Product, kind: ProductKind) {
    const key = productStateKey(product.id, kind);
    const alreadyChosen = chosenKeys.includes(key);
    const nextChosenKeys = alreadyChosen
      ? chosenKeys.filter((chosenKey) => chosenKey !== key)
      : [...chosenKeys, key];

    setChosenKeys(nextChosenKeys);
    if (sessionId) {
      void recordEvent(sessionId, {
        eventType: 'product_chosen',
        productId: product.id,
        productKind: kind,
        elapsedMs: elapsedMs(),
        metadata: {
          condition,
          studyMode,
          displayScope: 'all-products',
          selectionAction: alreadyChosen ? 'removed' : 'added',
          selectedCount: nextChosenKeys.length,
        },
      }).catch(() => setRecordingError(true));
    }
  }

  function toggleSaved(product: Product, kind: ProductKind) {
    const key = productStateKey(product.id, kind);
    const nextSavedKeys = savedKeys.includes(key)
      ? savedKeys.filter((savedKey) => savedKey !== key)
      : [...savedKeys, key];

    setSavedKeys(nextSavedKeys);
    if (nextSavedKeys.length === 0) setShowSavedOnly(false);
  }

  async function startParticipantSession() {
    const cleanedName = participantName.trim().replace(/\s+/g, ' ');
    if (!cleanedName || !participantCondition) return;

    const localStartedAt = Date.now();
    setStartingSession(true);
    setRecordingError(false);
    setStartError(null);
    setChosenKeys([]);
    setCompleted(false);

    try {
      const session = await createStudySession({
        participantName: cleanedName,
        studyMode,
        condition: participantCondition,
        scenarioIndex: 1,
      });
      setCondition(participantCondition);
      setActiveParticipantName(cleanedName);
      setSessionId(session.id);
      setDataSource('database');
      setStartedAt(localStartedAt);
      setTestStarted(true);
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}?condition=${participantCondition}`,
      );
    } catch {
      setSessionId(null);
      setRecordingError(true);
      setStartError(
        'The database could not start this test. Check the connection and try again.',
      );
    } finally {
      setStartingSession(false);
    }
  }

  function markTaskComplete() {
    setCompleted(true);
    if (!sessionId || !startedAt) return;

    const [productId, productKind] =
      chosenKeys.length === 1 ? chosenKeys[0].split('::') : [];
    void completeStudySession(sessionId, {
      elapsedMs: Date.now() - startedAt,
      productId,
      productKind:
        productKind === 'standard' || productKind === 'imperfect'
          ? productKind
          : undefined,
    }).catch(() => setRecordingError(true));
  }

  if (!testStarted) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef4ee] px-4 py-10 text-[#18322a]">
        <section className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-[#d3ded5] bg-white shadow-[0_24px_70px_rgba(14,63,42,0.12)]">
          <div className="bg-[#0b4a32] px-6 py-5 text-white sm:px-9">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-white/15">
                <Leaf className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xl font-black tracking-[-0.04em]">
                  fresh choice
                </p>
                <p className="text-xs font-semibold text-white/75">
                  University research prototype
                </p>
              </div>
            </div>
          </div>

          <form
            className="space-y-7 p-6 sm:p-9"
            onSubmit={(event) => {
              event.preventDefault();
              void startParticipantSession();
            }}
          >
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.13em] text-[#17733a]">
                Welcome
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Start the shopping test
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#5a6d62] sm:text-base">
                Enter your name and choose the assigned label condition. Your
                test will begin after the database creates your participant
                session.
              </p>
            </div>

            <div>
              <label
                htmlFor="participant-name"
                className="text-sm font-extrabold text-[#294a38]"
              >
                Your name
              </label>
              <input
                id="participant-name"
                name="participantName"
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                maxLength={80}
                autoComplete="name"
                placeholder="Enter your name"
                className="mt-2 h-12 w-full rounded-xl border border-[#aebdb3] bg-[#fbfcfa] px-4 text-base outline-none transition placeholder:text-[#8b9890] focus:border-[#1b7f3a] focus:ring-4 focus:ring-[#1b7f3a]/10"
              />
            </div>

            <fieldset>
              <legend className="text-sm font-extrabold text-[#294a38]">
                Choose a label condition
              </legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(['A', 'B'] as Condition[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={participantCondition === option}
                    onClick={() => setParticipantCondition(option)}
                    className={`rounded-2xl border p-4 text-left transition ${participantCondition === option ? 'border-[#1b7f3a] bg-[#edf7ef] ring-4 ring-[#1b7f3a]/10' : 'border-[#dce3dd] bg-white hover:bg-[#f7faf7]'}`}
                  >
                    <span className="flex items-center justify-between text-sm font-black text-[#234f37]">
                      Version {option}
                      {participantCondition === option && (
                        <Check className="size-4" aria-hidden="true" />
                      )}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#66766d]">
                      Use the version assigned for this test.
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="rounded-2xl border border-[#dfdfbf] bg-[#fff9da] p-4 text-xs leading-5 text-[#62551d]">
              Your name, selected condition, product interactions and task
              timing will be stored in the research database. Do not enter an
              email address, student number or other sensitive information.
            </div>

            {startError && (
              <p
                role="alert"
                className="rounded-xl border border-[#efc5bd] bg-[#fff2ef] px-4 py-3 text-sm font-semibold text-[#9a2f20]"
              >
                {startError}
              </p>
            )}

            <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-xs text-[#6c7c73]">
                {dataSource === 'database'
                  ? 'Research database connected'
                  : dataSource === 'loading'
                    ? 'Checking research database…'
                    : 'Product preview loaded · database connection required'}
              </p>
              <Button
                type="submit"
                disabled={
                  startingSession ||
                  !participantName.trim() ||
                  !participantCondition
                }
                className="h-12 rounded-xl bg-[#1b7f3a] px-7 text-base font-bold hover:bg-[#12692f]"
              >
                {startingSession ? 'Starting test…' : 'Start test'}
              </Button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#18322a]">
      <div className="bg-[#073f2b] px-4 py-2 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <span className="text-[11px] font-bold tracking-[0.11em] sm:text-xs">
            UNIVERSITY RESEARCH PROTOTYPE · NOT A REAL STORE
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-semibold text-white/80 sm:inline">
              {activeParticipantName} · Condition {condition}
            </span>
            <button
              onClick={markTaskComplete}
              className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#0b4a32] transition hover:bg-[#edf7ef]"
            >
              Finish test
            </button>
          </div>
        </div>
      </div>

      <header className="border-b border-[#d7ded8] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-4 md:px-8">
          <a
            href="#products"
            className="flex shrink-0 items-center gap-2"
            aria-label="Fresh Choice home"
          >
            <span className="grid size-10 place-items-center rounded-full bg-[#1b7f3a] text-white">
              <Leaf aria-hidden="true" className="size-5" />
            </span>
            <span className="text-xl font-extrabold tracking-[-0.04em] text-[#116b34]">
              fresh choice
            </span>
          </a>

          <div className="hidden flex-1 items-center gap-3 rounded-full border border-[#b7c5bc] bg-[#fbfcfa] px-5 py-3 md:flex">
            <Search aria-hidden="true" className="size-5 text-[#456154]" />
            <span className="text-sm text-[#617269]">
              Search fruit, vegetables and more
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              className="hidden h-11 rounded-full px-4 text-[#214c38] sm:flex"
            >
              <MapPin aria-hidden="true" /> St Lucia
            </Button>
            <Button
              onClick={() => setShowSavedOnly((current) => !current)}
              variant="outline"
              size="icon-lg"
              disabled={savedKeys.length === 0}
              aria-pressed={showSavedOnly}
              className={`relative rounded-full ${showSavedOnly ? 'border-[#c8432c] bg-[#fff2ef] text-[#c8432c]' : ''}`}
              aria-label={
                showSavedOnly ? 'Show all products' : 'Show saved products'
              }
            >
              <Heart
                aria-hidden="true"
                fill={savedKeys.length > 0 ? 'currentColor' : 'none'}
              />
              {savedKeys.length > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#c8432c] text-[10px] font-black text-white">
                  {savedKeys.length}
                </span>
              )}
            </Button>
            <Button
              size="icon-lg"
              className="relative rounded-full bg-[#1b7f3a]"
              aria-label="Shopping cart"
            >
              <ShoppingCart aria-hidden="true" />
              {chosenKeys.length > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#f4d44d] text-[10px] font-black text-[#263b2f]">
                  {chosenKeys.length}
                </span>
              )}
            </Button>
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-4 pb-3 text-sm font-semibold text-[#385848] md:px-8"
          aria-label="Shop categories"
        >
          <span className="whitespace-nowrap text-[#117232]">
            Fruit &amp; veg
          </span>
          <span className="whitespace-nowrap">Specials</span>
          <span className="whitespace-nowrap">Bakery</span>
          <span className="whitespace-nowrap">Pantry</span>
          <span className="whitespace-nowrap">Food waste savings</span>
        </nav>
      </header>

      {studyMode !== 'browse' ? (
        <section className="border-b border-[#ccdacd] bg-[#eef5ef]">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 md:grid-cols-[1fr_auto] md:items-center md:px-8">
            <div className="flex gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#176c36] shadow-sm">
                <ClipboardCheck className="size-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#176c36]">
                    All-product research task
                  </p>
                  <span className="rounded-full bg-[#123f2b] px-2.5 py-1 text-[10px] font-bold text-white">
                    Condition {condition}
                  </span>
                </div>
                <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-[#294a38]">
                  {studyMode === 'comparison'
                    ? 'Compare the standard and value options across the full range, then choose the product you would buy.'
                    : 'Review every product label, then choose the option that best suits your needs.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#5c6f64]">
              <Clock3 className="size-4" aria-hidden="true" />
              {startedAt
                ? sessionId && !recordingError
                  ? 'Participant recording active'
                  : 'Session active · recording unavailable'
                : 'Return to the start screen'}
            </div>
          </div>
        </section>
      ) : (
        <section className="border-b border-[#dfdfbf] bg-[#fff7c7]">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 py-7 md:flex-row md:items-center md:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#6a5a00]">
                Fresh choices for everyone
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#164c2f] md:text-4xl">
                There&apos;s something fresh for everyone.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#405c4d] md:text-base">
                Choose the fruit and vegetables that suit your needs,
                preferences and budget, with clear quality and price
                information.
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/70 px-5 py-3 text-sm font-semibold text-[#315642] shadow-sm ring-1 ring-black/5">
              More choice · clearer value
            </div>
          </div>
        </section>
      )}

      <section
        id="products"
        className="mx-auto max-w-7xl px-4 py-9 md:px-8 md:py-12"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#17733a]">Fruit &amp; veg</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] md:text-3xl">
              {studyMode === 'comparison'
                ? 'Compare the full range'
                : studyMode === 'comprehension'
                  ? 'Review all product labels'
                  : 'Fresh value picks'}
            </h1>
          </div>
          {studyMode === 'browse' ? (
            <p className="text-sm text-[#65746b]">
              {showSavedOnly
                ? `${savedKeys.length} saved products`
                : `${products.length} products`}{' '}
              · {chosenKeys.length} selected · Condition {condition}
            </p>
          ) : (
            <button
              onClick={resetSession}
              className="rounded-full border border-[#a8b9ad] bg-white px-4 py-2 text-xs font-bold text-[#315643]"
            >
              Return to start
            </button>
          )}
        </div>

        {studyMode === 'comparison' ? (
          <div className="space-y-8">
            {products.map((product) => (
              <section
                key={product.id}
                aria-labelledby={`${product.id}-comparison-heading`}
              >
                <h2
                  id={`${product.id}-comparison-heading`}
                  className="mb-3 text-lg font-extrabold text-[#294a38]"
                >
                  {product.standardName} · {product.unit}
                </h2>
                <div className="grid gap-5 md:grid-cols-2">
                  <ProductCard
                    product={product}
                    condition={condition}
                    kind="standard"
                    onDetails={() => openDetails(product, 'standard')}
                    onChoose={() => chooseProduct(product, 'standard')}
                    onSave={() => toggleSaved(product, 'standard')}
                    chosen={chosenKeys.includes(
                      productStateKey(product.id, 'standard'),
                    )}
                    saved={savedKeys.includes(
                      productStateKey(product.id, 'standard'),
                    )}
                  />
                  <ProductCard
                    product={product}
                    condition={condition}
                    kind="imperfect"
                    onDetails={() => openDetails(product, 'imperfect')}
                    onChoose={() => chooseProduct(product, 'imperfect')}
                    onSave={() => toggleSaved(product, 'imperfect')}
                    chosen={chosenKeys.includes(
                      productStateKey(product.id, 'imperfect'),
                    )}
                    saved={savedKeys.includes(
                      productStateKey(product.id, 'imperfect'),
                    )}
                  />
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {(showSavedOnly
              ? products.filter((product) =>
                  savedKeys.includes(productStateKey(product.id, 'imperfect')),
                )
              : products
            ).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                condition={condition}
                kind="imperfect"
                onDetails={() => openDetails(product, 'imperfect')}
                onChoose={() => chooseProduct(product, 'imperfect')}
                onSave={() => toggleSaved(product, 'imperfect')}
                chosen={chosenKeys.includes(
                  productStateKey(product.id, 'imperfect'),
                )}
                saved={savedKeys.includes(
                  productStateKey(product.id, 'imperfect'),
                )}
              />
            ))}
          </div>
        )}

        {studyMode !== 'browse' && (
          <div className="mx-auto mt-7 flex max-w-4xl flex-col items-center justify-between gap-4 rounded-2xl border border-[#dbe2dc] bg-white p-5 sm:flex-row">
            <div className="flex items-start gap-3">
              <Info
                className="mt-0.5 size-5 shrink-0 text-[#356b4a]"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-bold text-[#274b38]">
                  For the facilitator
                </p>
                <p className="mt-1 text-xs leading-5 text-[#65746b]">
                  Record the participant’s answer, time, hesitation and help
                  requests on the observation sheet. When recording is active,
                  this prototype stores participant-linked clicks and task
                  timing.
                </p>
              </div>
            </div>
            <Button
              onClick={markTaskComplete}
              disabled={chosenKeys.length === 0}
              className="h-11 shrink-0 rounded-xl bg-[#173f2d] px-5 font-bold"
            >
              <CheckCircle2 aria-hidden="true" /> Mark task complete
            </Button>
          </div>
        )}
      </section>

      <section className="border-y border-[#dce4dd] bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 md:px-8">
          <div className="flex gap-3">
            <Tag
              className="size-5 shrink-0 text-[#1b7f3a]"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-extrabold">Price transparency</h2>
              <p className="mt-1 text-xs leading-5 text-[#66766d]">
                Current price, pack quantity and calculated savings use one
                product record.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck
              className="size-5 shrink-0 text-[#1b7f3a]"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-extrabold">Clear quality status</h2>
              <p className="mt-1 text-xs leading-5 text-[#66766d]">
                Appearance differences are separated from freshness and eating
                quality.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ClipboardCheck
              className="size-5 shrink-0 text-[#1b7f3a]"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-extrabold">Controlled study modes</h2>
              <p className="mt-1 text-xs leading-5 text-[#66766d]">
                Condition A and B retain the same product, image, quantity and
                actual price.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#123f2b] px-4 py-7 text-[#dce9e0]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-xs leading-5 sm:flex-row md:px-4">
          <div>
            <p className="font-bold text-white">
              Fresh Choice · University research prototype
            </p>
            <p>
              Sample product data is marked “not verified” until checked against
              the team’s approved source sheet.
            </p>
          </div>
          <p className="max-w-xl sm:text-right">
            Product imagery: CC0/public-domain sources and Unsplash. This
            independent prototype is not affiliated with or endorsed by
            Woolworths.
          </p>
        </div>
      </footer>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:max-w-3xl md:p-6">
          <DialogHeader className="sr-only">
            <DialogTitle>Product details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected fresh produce product.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <ProductDetail
              product={selected.product}
              condition={condition}
              kind={selected.kind}
            />
          )}
          <DialogFooter className="mt-2 rounded-b-3xl">
            <Button
              onClick={() =>
                selected && chooseProduct(selected.product, selected.kind)
              }
              className="h-11 rounded-xl bg-[#1b7f3a] px-5 font-bold"
            >
              {selected &&
              chosenKeys.includes(
                productStateKey(selected.product.id, selected.kind),
              ) ? (
                <Check aria-hidden="true" />
              ) : (
                <ShoppingCart aria-hidden="true" />
              )}
              {selected &&
              chosenKeys.includes(
                productStateKey(selected.product.id, selected.kind),
              )
                ? 'Remove selection'
                : 'Choose this product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={completed} onOpenChange={setCompleted}>
        <DialogContent className="rounded-3xl p-6 sm:max-w-md">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#e9f6ec] text-[#18723a]">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-black">
              Test complete
            </DialogTitle>
            <DialogDescription>
              {sessionId && !recordingError
                ? `The interactions and completion time for ${activeParticipantName} were saved. Continue with the team’s questionnaire.`
                : 'The test ended, but the recording API was unavailable. Record the result on the observation sheet.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 rounded-b-3xl">
            <Button
              onClick={() => {
                resetSession();
                setCompleted(false);
              }}
              className="h-11 rounded-xl bg-[#1b7f3a] px-5 font-bold"
            >
              Start next participant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
