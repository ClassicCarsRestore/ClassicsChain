package algorand

import (
	"context"
	"crypto/ed25519"
	"fmt"

	"github.com/algorand/go-algorand-sdk/v2/client/v2/algod"
	"github.com/algorand/go-algorand-sdk/v2/client/v2/indexer"
	"github.com/algorand/go-algorand-sdk/v2/crypto"
	"github.com/algorand/go-algorand-sdk/v2/mnemonic"
	"github.com/algorand/go-algorand-sdk/v2/transaction"
	"github.com/algorand/go-algorand-sdk/v2/types"
)

type Client struct {
	algod   *algod.Client
	indexer *indexer.Client
	account crypto.Account
}

type Config struct {
	AlgodURL   string
	AlgodToken string
	IndexerURL string
	Mnemonic   string
}

func New(cfg Config) (*Client, error) {
	if cfg.AlgodURL == "" {
		return nil, fmt.Errorf("algod URL is required")
	}

	algodClient, err := algod.MakeClient(cfg.AlgodURL, cfg.AlgodToken)
	if err != nil {
		return nil, fmt.Errorf("create algod client: %w", err)
	}

	var indexerClient *indexer.Client
	if cfg.IndexerURL != "" {
		indexerClient, err = indexer.MakeClient(cfg.IndexerURL, "")
		if err != nil {
			return nil, fmt.Errorf("create indexer client: %w", err)
		}
	}

	if cfg.Mnemonic == "" {
		return nil, fmt.Errorf("wallet mnemonic is required")
	}

	privateKey, err := mnemonic.ToPrivateKey(cfg.Mnemonic)
	if err != nil {
		return nil, fmt.Errorf("invalid mnemonic: %w", err)
	}

	account := crypto.Account{
		PrivateKey: privateKey,
	}
	account.Address = types.Address(account.PrivateKey.Public().(ed25519.PublicKey))

	return &Client{
		algod:   algodClient,
		indexer: indexerClient,
		account: account,
	}, nil
}

func (c *Client) Address() string {
	return c.account.Address.String()
}

func (c *Client) SuggestedParams(ctx context.Context) (types.SuggestedParams, error) {
	params, err := c.algod.SuggestedParams().Do(ctx)
	if err != nil {
		return types.SuggestedParams{}, fmt.Errorf("get suggested params: %w", err)
	}
	return params, nil
}

func (c *Client) SendTransaction(ctx context.Context, txn types.Transaction) (string, error) {
	_, signedTxn, err := crypto.SignTransaction(c.account.PrivateKey, txn)
	if err != nil {
		return "", fmt.Errorf("sign transaction: %w", err)
	}

	txID, err := c.algod.SendRawTransaction(signedTxn).Do(ctx)
	if err != nil {
		return "", fmt.Errorf("send transaction: %w", err)
	}

	_, err = transaction.WaitForConfirmation(c.algod, txID, 4, ctx)
	if err != nil {
		return "", fmt.Errorf("wait for confirmation: %w", err)
	}

	return txID, nil
}

func (c *Client) IsOnline(ctx context.Context) bool {
	_, err := c.algod.Status().Do(ctx)
	return err == nil
}
