"use client";

import {
  IonButton,
  IonCheckbox,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonReorder,
  IonReorderGroup,
  IonToggle,
  type ItemReorderEventDetail,
} from "@ionic/react";
import {
  addOutline,
  archiveOutline,
  bookOutline,
  checkmarkCircleOutline,
  flameOutline,
  leafOutline,
  moonOutline,
  peopleOutline,
  sunnyOutline,
} from "ionicons/icons";
import { useState } from "react";

const HABITS = [
  { id: "1", name: "أذكار الصباح", note: "خمس دقائق", icon: sunnyOutline },
  { id: "2", name: "وردٌ من القرآن", note: "صفحة واحدة", icon: bookOutline },
  { id: "3", name: "قيلولة قصيرة", note: "عشرون دقيقة", icon: moonOutline },
  { id: "4", name: "وقت هادئ مع العائلة", note: "بعد المغرب", icon: peopleOutline },
];

/** Development-only reference for Ionic's IonButton and IonList in this app's RTL theme. */
export function IonicShowcase() {
  const [done, setDone] = useState<Record<string, boolean>>({ "1": true });
  const [habits, setHabits] = useState(HABITS);
  const [reminders, setReminders] = useState(true);

  const reorder = (event: CustomEvent<ItemReorderEventDetail>) => {
    setHabits((list) => event.detail.complete(list));
  };

  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-8 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">مكوّنات Ionic</h1>
        <p className="text-ink-700">IonButton و IonList داخل التطبيق: عربية، من اليمين إلى اليسار، وبألوان «الحياة الطيبة».</p>
      </header>

      <section aria-labelledby="buttons" className="flex flex-col gap-3">
        <h2 id="buttons" className="text-lg font-semibold">IonButton</h2>

        <p className="text-sm text-ink-500">fill: solid · outline · clear</p>
        <div className="flex flex-wrap gap-2">
          <IonButton>ابدأ يومي</IonButton>
          <IonButton fill="outline">اجعلها عادة</IonButton>
          <IonButton fill="clear">لاحقًا</IonButton>
        </div>

        <p className="text-sm text-ink-500">color: primary · secondary · shape: round · مع أيقونة</p>
        <div className="flex flex-wrap gap-2">
          <IonButton color="secondary" shape="round">
            <IonIcon slot="start" icon={checkmarkCircleOutline} />
            أنجزت التحدّي
          </IonButton>
          <IonButton shape="round" fill="outline">
            <IonIcon slot="start" icon={addOutline} />
            أضف عادة
          </IonButton>
          <IonButton shape="round" aria-label="إضافة">
            <IonIcon slot="icon-only" icon={addOutline} />
          </IonButton>
        </div>

        <p className="text-sm text-ink-500">size: small · default · large · expand: block · disabled</p>
        <div className="flex flex-wrap items-center gap-2">
          <IonButton size="small">صغير</IonButton>
          <IonButton>عادي</IonButton>
          <IonButton size="large">كبير</IonButton>
        </div>
        <IonButton expand="block">اختم يومي</IonButton>
        <IonButton expand="block" disabled>
          غير متاح
        </IonButton>
      </section>

      <section aria-labelledby="lists" className="flex flex-col gap-3">
        <h2 id="lists" className="text-lg font-semibold">IonList</h2>

        <IonList inset lines="full">
          <IonListHeader>
            <IonLabel>عاداتي اليومية — مع IonCheckbox</IonLabel>
          </IonListHeader>
          {HABITS.map((h) => (
            <IonItem key={h.id}>
              <IonIcon slot="start" icon={h.icon} aria-hidden="true" />
              <IonCheckbox
                justify="space-between"
                checked={Boolean(done[h.id])}
                onIonChange={(e) => setDone((d) => ({ ...d, [h.id]: e.detail.checked }))}
              >
                {h.name}
              </IonCheckbox>
            </IonItem>
          ))}
        </IonList>

        <IonList inset>
          <IonListHeader>
            <IonLabel>عنوان ووصف وملاحظة — IonLabel و IonNote</IonLabel>
          </IonListHeader>
          <IonItem button detail>
            <IonIcon slot="start" icon={flameOutline} aria-hidden="true" />
            <IonLabel>
              <h3>سلسلة الاستمرارية</h3>
              <p>أطول متتالية هذا الشهر</p>
            </IonLabel>
            <IonNote slot="end">٧ أيام</IonNote>
          </IonItem>
          <IonItem button detail>
            <IonIcon slot="start" icon={leafOutline} aria-hidden="true" />
            <IonLabel>
              <h3>تقدّمك اليوم</h3>
              <p>من عاداتك اليوم مكتملة</p>
            </IonLabel>
            <IonNote slot="end">١٤٪</IonNote>
          </IonItem>
          <IonItem>
            <IonToggle checked={reminders} onIonChange={(e) => setReminders(e.detail.checked)}>
              تذكير هادئ صباحًا
            </IonToggle>
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader>
            <IonLabel>اسحب العنصر لإظهار الأرشفة — IonItemSliding</IonLabel>
          </IonListHeader>
          <IonItemSliding>
            <IonItem>
              <IonLabel>ترك السكّر المضاف</IonLabel>
            </IonItem>
            <IonItemOptions side="end">
              <IonItemOption color="secondary">
                <IonIcon slot="start" icon={archiveOutline} />
                أرشفة
              </IonItemOption>
            </IonItemOptions>
          </IonItemSliding>
        </IonList>

        <IonList inset>
          <IonListHeader>
            <IonLabel>إعادة الترتيب — IonReorderGroup</IonLabel>
          </IonListHeader>
          <IonReorderGroup disabled={false} onIonItemReorder={reorder}>
            {habits.map((h) => (
              <IonItem key={h.id}>
                <IonLabel>{h.name}</IonLabel>
                <IonReorder slot="end" />
              </IonItem>
            ))}
          </IonReorderGroup>
        </IonList>
      </section>
    </main>
  );
}
