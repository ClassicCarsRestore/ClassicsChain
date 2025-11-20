package ipfs

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/ipfs/boxo/files"
	"github.com/ipfs/boxo/path"
	"github.com/ipfs/kubo/client/rpc"
)

// Client wraps the IPFS RPC client
type Client struct {
	rpc *rpc.HttpApi
}

// New creates a new IPFS client
func New(apiURL string) *Client {
	api, _ := rpc.NewURLApiWithClient(apiURL, &http.Client{})
	return &Client{
		rpc: api,
	}
}

// AddJSON adds a JSON document to IPFS and returns its CID
func (c *Client) AddJSON(ctx context.Context, data interface{}) (string, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("marshal json: %w", err)
	}

	file := files.NewBytesFile(jsonData)
	cidPath, err := c.rpc.Unixfs().Add(ctx, file)
	if err != nil {
		return "", fmt.Errorf("add to ipfs: %w", err)
	}

	return cidPath.RootCid().String(), nil
}

// AddJSONAndPin adds a JSON document to IPFS and pins it, returning the CID
func (c *Client) AddJSONAndPin(ctx context.Context, data interface{}) (string, error) {
	cid, err := c.AddJSON(ctx, data)
	if err != nil {
		return "", err
	}

	if err := c.Pin(ctx, cid); err != nil {
		return "", fmt.Errorf("pin json: %w", err)
	}

	return cid, nil
}

// AddBytes adds raw bytes to IPFS and returns its CID
func (c *Client) AddBytes(ctx context.Context, data []byte, name *string) (string, error) {
	file := files.NewBytesFile(data)
	cidPath, err := c.rpc.Unixfs().Add(ctx, file)
	if err != nil {
		return "", fmt.Errorf("add to ipfs: %w", err)
	}

	return cidPath.RootCid().String(), nil
}

// Get retrieves content from IPFS by CID
func (c *Client) Get(ctx context.Context, cid string) ([]byte, error) {
	p, err := path.NewPath("/ipfs/" + cid)
	if err != nil {
		return nil, fmt.Errorf("invalid cid: %w", err)
	}

	node, err := c.rpc.Unixfs().Get(ctx, p)
	if err != nil {
		return nil, fmt.Errorf("get from ipfs: %w", err)
	}

	file := files.ToFile(node)
	if file == nil {
		return nil, fmt.Errorf("node is not a file")
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("read ipfs content: %w", err)
	}

	return data, nil
}

// GetJSON retrieves and unmarshals JSON content from IPFS by CID
func (c *Client) GetJSON(ctx context.Context, cid string, v interface{}) error {
	data, err := c.Get(ctx, cid)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(data, v); err != nil {
		return fmt.Errorf("unmarshal json: %w", err)
	}

	return nil
}

// Pin pins a CID to prevent garbage collection
func (c *Client) Pin(ctx context.Context, cid string) error {
	p, err := path.NewPath("/ipfs/" + cid)
	if err != nil {
		return fmt.Errorf("invalid cid: %w", err)
	}

	if err := c.rpc.Pin().Add(ctx, p); err != nil {
		return fmt.Errorf("pin cid: %w", err)
	}
	return nil
}

// Unpin unpins a CID
func (c *Client) Unpin(ctx context.Context, cid string) error {
	p, err := path.NewPath("/ipfs/" + cid)
	if err != nil {
		return fmt.Errorf("invalid cid: %w", err)
	}

	if err := c.rpc.Pin().Rm(ctx, p); err != nil {
		return fmt.Errorf("unpin cid: %w", err)
	}
	return nil
}

// IsOnline checks if the IPFS node is reachable
func (c *Client) IsOnline(ctx context.Context) bool {
	_, err := c.rpc.Swarm().Peers(ctx)
	return err == nil
}
