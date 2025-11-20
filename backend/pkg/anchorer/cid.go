package anchorer

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"

	"github.com/ipfs/go-cid"
	"github.com/ipld/go-ipld-prime/codec/dagcbor"
	"github.com/ipld/go-ipld-prime/codec/dagjson"
	"github.com/ipld/go-ipld-prime/datamodel"
	"github.com/ipld/go-ipld-prime/node/basicnode"
	mh "github.com/multiformats/go-multihash"
)

type CID struct {
	CID        string
	SourceJSON string
	SourceCBOR string
}

// GenerateCID generates a deterministic CIDv1 using dag-cbor codec and SHA-256 hashing.
// DAG-CBOR provides canonical encoding guarantees, ensuring the same data always produces
// the same CID regardless of platform or Go version. The returned CID struct includes the
// CID string, the canonical DAG-JSON representation, and the base64-encoded DAG-CBOR bytes that was hashed.
func GenerateCID(data interface{}) (*CID, error) {
	result := &CID{}

	// 1. Convert Go struct → IPLD node
	node, err := goDataToIPLDNode(data)
	if err != nil {
		return nil, fmt.Errorf("failed to convert to IPLD node: %w", err)
	}

	// 2. Encode as canonical DAG-JSON (for storage/display)
	var jsonBuf bytes.Buffer
	if err := dagjson.Encode(node, &jsonBuf); err != nil {
		return nil, fmt.Errorf("failed to encode as DAG-JSON: %w", err)
	}
	result.SourceJSON = string(jsonBuf.Bytes())

	// 3. Encode as DAG-CBOR (for CID generation)
	var cborBuf bytes.Buffer
	if err := dagcbor.Encode(node, &cborBuf); err != nil {
		return nil, fmt.Errorf("failed to encode as DAG-CBOR: %w", err)
	}
	result.SourceCBOR = base64.StdEncoding.EncodeToString(cborBuf.Bytes())

	// 4. (Multi)Hash CBOR and create CID
	hash, err := mh.Sum(cborBuf.Bytes(), mh.SHA2_256, -1)
	if err != nil {
		return nil, fmt.Errorf("failed to hash: %w", err)
	}
	result.CID = cid.NewCidV1(cid.DagCBOR, hash).String()

	return result, nil
}

// goDataToIPLDNode converts Go data structures to IPLD datamodel.Node
func goDataToIPLDNode(data interface{}) (datamodel.Node, error) {
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal to JSON: %w", err)
	}

	var intermediate interface{}
	if err := json.Unmarshal(jsonBytes, &intermediate); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %w", err)
	}

	return convertToIPLDNode(intermediate)
}

// convertToIPLDNode recursively converts Go types to IPLD nodes
func convertToIPLDNode(v interface{}) (datamodel.Node, error) {
	switch val := v.(type) {
	case nil:
		return datamodel.Null, nil
	case bool:
		return basicnode.NewBool(val), nil
	case int:
		return basicnode.NewInt(int64(val)), nil
	case float64:
		return basicnode.NewFloat(val), nil
	case string:
		return basicnode.NewString(val), nil
	case []interface{}:
		listBuilder := basicnode.Prototype.List.NewBuilder()
		listAssembler, err := listBuilder.BeginList(int64(len(val)))
		if err != nil {
			return nil, err
		}
		for _, item := range val {
			node, err := convertToIPLDNode(item)
			if err != nil {
				return nil, err
			}
			if err := listAssembler.AssembleValue().AssignNode(node); err != nil {
				return nil, err
			}
		}
		if err := listAssembler.Finish(); err != nil {
			return nil, err
		}
		return listBuilder.Build(), nil
	case map[string]interface{}:
		mapBuilder := basicnode.Prototype.Map.NewBuilder()
		mapAssembler, err := mapBuilder.BeginMap(int64(len(val)))
		if err != nil {
			return nil, err
		}
		for k, item := range val {
			node, err := convertToIPLDNode(item)
			if err != nil {
				return nil, err
			}
			valueAssembler, err := mapAssembler.AssembleEntry(k)
			if err != nil {
				return nil, err
			}
			if err := valueAssembler.AssignNode(node); err != nil {
				return nil, err
			}
		}
		if err := mapAssembler.Finish(); err != nil {
			return nil, err
		}
		return mapBuilder.Build(), nil
	default:
		return nil, fmt.Errorf("unsupported type: %T", v)
	}
}
