package algorand

import (
	"context"
	"fmt"

	"github.com/algorand/go-algorand-sdk/v2/transaction"
	"github.com/algorand/go-algorand-sdk/v2/types"
)

type AssetParams struct {
	AssetName     string
	UnitName      string
	URL           string
	Total         uint64
	Decimals      uint32
	DefaultFrozen bool
	Manager       string
	Reserve       string
	Freeze        string
	Clawback      string
	Note          []byte
}

func (c *Client) CreateAsset(ctx context.Context, params AssetParams) (uint64, string, error) {
	txParams, err := c.SuggestedParams(ctx)
	if err != nil {
		return 0, "", fmt.Errorf("get transaction params: %w", err)
	}

	manager := params.Manager
	if manager == "" {
		manager = c.account.Address.String()
	}
	reserve := params.Reserve
	if reserve == "" {
		reserve = c.account.Address.String()
	}
	freeze := params.Freeze
	if freeze == "" {
		freeze = c.account.Address.String()
	}
	clawback := params.Clawback
	if clawback == "" {
		clawback = c.account.Address.String()
	}

	txn, err := transaction.MakeAssetCreateTxn(
		c.account.Address.String(),
		params.Note,
		txParams,
		params.Total,
		params.Decimals,
		params.DefaultFrozen,
		manager,
		reserve,
		freeze,
		clawback,
		params.UnitName,
		params.AssetName,
		params.URL,
		"",
	)
	if err != nil {
		return 0, "", fmt.Errorf("create asset transaction: %w", err)
	}

	txID, err := c.SendTransaction(ctx, txn)
	if err != nil {
		return 0, "", fmt.Errorf("send asset creation: %w", err)
	}

	pendingTxn, _, err := c.algod.PendingTransactionInformation(txID).Do(ctx)
	if err != nil {
		return 0, "", fmt.Errorf("get pending transaction: %w", err)
	}

	return pendingTxn.AssetIndex, txID, nil
}

func (c *Client) TransferAsset(ctx context.Context, assetID uint64, recipient string, amount uint64, note []byte) (string, error) {
	txParams, err := c.SuggestedParams(ctx)
	if err != nil {
		return "", fmt.Errorf("get transaction params: %w", err)
	}

	recipientAddr, err := types.DecodeAddress(recipient)
	if err != nil {
		return "", fmt.Errorf("invalid recipient: %w", err)
	}

	txn, err := transaction.MakeAssetTransferTxn(
		c.account.Address.String(),
		recipientAddr.String(),
		amount,
		note,
		txParams,
		"",
		assetID,
	)
	if err != nil {
		return "", fmt.Errorf("create transfer transaction: %w", err)
	}

	txID, err := c.SendTransaction(ctx, txn)
	if err != nil {
		return "", fmt.Errorf("send transfer: %w", err)
	}

	return txID, nil
}

func (c *Client) SelfTransferAsset(ctx context.Context, assetID uint64, note []byte) (string, error) {
	return c.TransferAsset(ctx, assetID, c.account.Address.String(), 0, note)
}
