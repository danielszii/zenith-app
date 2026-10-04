# Zenith App

Aplicativo profissional de súmula eletrônica offline-first para Android e iOS.

## Arquitetura

- `src/database`: schema versionado, migrations e modelos WatermelonDB/SQLite.
- `src/services`: casos de uso transacionais e motor de sincronização.
- `src/screens`: jornadas de pré-jogo, operação ao vivo e pós-jogo.
- `src/components`: componentes reutilizáveis, assinatura e estado de conexão.

Toda ação é persistida localmente antes de atualizar a interface. A mesma transação cria um item idempotente em `sync_queue`. O motor envia um lote JSON ordenado, remove apenas operações confirmadas pelo servidor e usa retry exponencial em falhas.

## Fluxos implementados

1. Pré-jogo: pacote offline, BID/elegibilidade, check-in, titulares, suplentes, numeração, capitães, arbitragem, comissões e quatro assinaturas.
2. Ao vivo: cronómetro persistente, períodos, gols normal/pênalti/contra, cartões com segundo amarelo automático, substituições, faltas cumulativas e pedidos de tempo.
3. Pós-jogo: resumo, cinco assinaturas obrigatórias, fechamento local e fila atômica.

## Contrato de sincronização

O app envia `POST /mobile/sync` com:

```json
{
  "deviceId": "zenith-mobile",
  "sentAt": 0,
  "operations": [
    {
      "operationId": "id-idempotente",
      "matchId": "id-partida",
      "entity": "event",
      "action": "create",
      "timestamp": 0,
      "data": {}
    }
  ]
}
```

Resposta esperada:

```json
{ "acceptedOperationIds": ["id-idempotente"] }
```

O backend deve manter índice único por `operationId` e processar o lote em uma transação de banco.

## Desenvolvimento Android

```powershell
npm install
npm start
```

Em outro terminal:

```powershell
npm run android
```

Para aparelho físico, configure `API_URL` em `src/services/sync.ts` com o IP local do computador. `10.0.2.2` funciona no emulador Android.

## Qualidade

```powershell
npm run typecheck
npm run lint
cd android
.\gradlew.bat assembleDebug --no-parallel
```
