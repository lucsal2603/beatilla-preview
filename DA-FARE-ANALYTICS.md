# Attivare le statistiche (Google Analytics o alternative)

Tutto è già predisposto. Quando il cliente vorrà le statistiche, servono
**tre passaggi**. Finché non li fai, il sito resta senza cookie di
tracciamento e **senza banner** — che è la situazione corretta di adesso.

---

## 1. Accendere l'interruttore

In `main.js`, cerca `TRACCIAMENTO_ATTIVO`:

```js
const TRACCIAMENTO_ATTIVO = false;   →   true
```

Da quel momento il banner compare al primo accesso, con Accetta e Rifiuta
di pari evidenza, e nel footer appare il link **"Preferenze cookie"** per
cambiare idea in seguito.

## 2. Scrivere il codice dello strumento

Sempre in `main.js`, dentro la funzione `avviaTracciamento()`. È vuota e
contiene un esempio commentato della forma che avrà il codice.

**Importante:** quella funzione viene eseguita **solo dopo** che l'utente ha
accettato. Non spostare il codice fuori da lì e non metterlo nell'HTML,
altrimenti partirebbe prima del consenso — che è esattamente la violazione
per cui il Garante ha sanzionato diversi siti italiani.

## 3. Completare le informative

- **`cookie.html`** e **`en/cookie.html`**: le sezioni da riempire sono
  evidenziate in arancione e iniziano con `[DA COMPLETARE]`. Servono nome
  dello strumento, cookie installati, durata, finalità ed eventuale
  trasferimento dati fuori dall'Unione Europea.
- **`privacy.html`** e **`en/privacy.html`**: nella sezione "Quali dati
  raccoglie questo sito" va corretta la frase che oggi dice che il sito non
  usa sistemi di statistica. Va aggiunto anche il fornitore come
  responsabile del trattamento.
- Collegare la cookie policy nel footer accanto alla privacy.

---

## Prima di scegliere: vale la pena valutare le alternative

Con **Google Analytics** servono banner, cookie policy completa e gestione
del consenso — cioè tutti e tre i passaggi qui sopra.

Con statistiche **senza cookie** (Plausible, Umami) si ottiene comunque
visite, provenienza, pagine più lette e clic su "Prenota", ma:

- niente banner e niente consenso da chiedere
- basta una riga in più nella privacy
- il sito resta veloce e pulito come adesso

Google Analytics conviene se fanno campagne pubblicitarie a pagamento e
devono misurare le conversioni. Per capire come va il sito, l'alternativa
è migliore sotto ogni aspetto.
