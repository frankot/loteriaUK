# Jak wysłać newsletter do subskrybentów przez Resend

Ten poradnik pokazuje krok po kroku jak wysłać kampanię email do użytkowników zapisanych w segmencie newslettera.

---

## 1. Wejdź do panelu Resend

Zaloguj się na [resend.com](https://resend.com) i przejdź do zakładki **Broadcasts** w lewym menu.

---

## 2. Kliknij „Create Broadcast”

W prawym górnym rogu naciśnij niebieski przycisk **Create Broadcast**.

---

## 3. Wybierz odbiorców

W polu **Audience** wybierz z listy swój segment newslettera (np. `Newsletter Subscribers`).

> Jeśli segment się nie pojawia, przejdź do **Segments** w lewym menu, znajdź segment `af17d32e-dc0e-469e-ab0e-c9134a1dbe84` i sprawdź czy ma kontakty.

---

## 4. Ustaw nadawcę

W polu **From** wpisz:

```
Golden Dream Draw <auth@goldendreamdraw.uk>
```

Możesz też dodać adres w polu **Reply-To** (opcjonalnie).

---

## 5. Wpisz temat i treść

- **Subject** – tytuł maila, np. „Nowa nagroda w Golden Dream Draw!”
- **Body** – treść maila (HTML lub zwykły tekst).

### Przykładowy szablon HTML

Możesz skorzystać z gotowego szablonu:

```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, serif; background: #FDF7EC; padding: 40px 0; margin: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #e8d5a3;">
    <tr>
      <td style="padding: 40px; text-align: center;">
        <h1 style="font-size: 28px; color: #1a1a1a; margin: 0 0 12px;">Golden Dream Draw</h1>
        <p style="font-size: 16px; color: #666; margin: 0 0 24px;">Nowe nagrody już czekają!</p>

        <div style="background: #FDF7EC; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="font-size: 20px; color: #b8943a; margin: 0 0 8px;"> Nagroda tygodnia</h2>
          <p style="font-size: 15px; color: #333; margin: 0 0 16px;">Tutaj opis nagrody i link do konkursu</p>
          <a href="https://goldendreamdraw.uk/competitions" style="display: inline-block; background: #b8943a; color: white; padding: 12px 32px; border-radius: 24px; text-decoration: none; font-weight: bold; font-size: 15px;">
            Zobacz konkursy
          </a>
        </div>

        <p style="font-size: 13px; color: #999; margin: 0 0 8px;">
          Otrzymujesz tego maila bo zapisałeś się do newslettera Golden Dream Draw.
        </p>
        <a href="{{{UnsubscribeUrl}}}" style="font-size: 13px; color: #b8943a;">Wypisz się</a>
      </td>
    </tr>
  </table>
</body>
</html>
```

> **Uwaga**: `{{{UnsubscribeUrl}}}` to zmienna Resend – automatycznie wstawi link do wypisania się. Używaj potrójnych nawiasów klamrowych.

---

## 6. Wyślij

Masz dwie opcje:

| Opcja | Co robi |
|-------|---------|
| **Send test** | Wyśle maila tylko na Twój adres – sprawdź jak wygląda |
| **Send now** | Wyśle do wszystkich subskrybentów w segmencie |

Zawsze najpierw wyślij test, potem kampanię.

---

## 7. Sprawdź statystyki (opcjonalnie)

Po wysłaniu w zakładce **Broadcasts** zobaczysz:

- ilu subskrybentów dostało maila (delivered)
- ile razy otworzyli (opened)
- ile razy kliknęli link (clicked)
- ile się wypisało (unsubscribed)

---

To wszystko. Cały proces to 2 minuty — wybierasz segment, wklejasz treść, wysyłasz.
