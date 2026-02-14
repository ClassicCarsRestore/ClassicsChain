package anchorer

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/ipfs/go-cid"
	"github.com/ipld/go-ipld-prime/codec/dagcbor"
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
// the same CID regardless of platform or Go version. SourceJSON is derived from the CBOR
// bytes so its key order matches what any CBOR decoder would produce.
func GenerateCID(data interface{}) (*CID, error) {
	result := &CID{}

	// 1. Convert Go struct → IPLD node
	node, err := goDataToIPLDNode(data)
	if err != nil {
		return nil, fmt.Errorf("failed to convert to IPLD node: %w", err)
	}

	// 2. Encode as DAG-CBOR (for CID generation)
	var cborBuf bytes.Buffer
	if err := dagcbor.Encode(node, &cborBuf); err != nil {
		return nil, fmt.Errorf("failed to encode as DAG-CBOR: %w", err)
	}
	result.SourceCBOR = base64.StdEncoding.EncodeToString(cborBuf.Bytes())

	// 3. Derive JSON from CBOR bytes so key order matches what CBOR decoders produce
	cborNode, err := ipldDecode(cborBuf.Bytes())
	if err != nil {
		return nil, fmt.Errorf("failed to decode DAG-CBOR for JSON derivation: %w", err)
	}
	jsonBytes, err := ipldNodeToJSON(cborNode)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize IPLD node to JSON: %w", err)
	}
	result.SourceJSON = string(jsonBytes)

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

// GenerateFileCID generates a CIDv1 for raw file content using SHA-256.
// This is used for binary files (images, documents) where the content is hashed directly.
func GenerateFileCID(content []byte) (string, error) {
	hash, err := mh.Sum(content, mh.SHA2_256, -1)
	if err != nil {
		return "", fmt.Errorf("failed to hash file content: %w", err)
	}
	return cid.NewCidV1(cid.Raw, hash).String(), nil
}

// CIDGenerator provides a method to generate CIDs for file content
type CIDGenerator struct{}

// GenerateFileCID implements the CIDGenerator interface for eventimages.Service
func (g *CIDGenerator) GenerateFileCID(content []byte) (string, error) {
	return GenerateFileCID(content)
}

// NewCIDGenerator creates a new CIDGenerator instance
func NewCIDGenerator() *CIDGenerator {
	return &CIDGenerator{}
}

// ipldDecode decodes DAG-CBOR bytes into an IPLD node.
func ipldDecode(data []byte) (datamodel.Node, error) {
	builder := basicnode.Prototype.Any.NewBuilder()
	if err := dagcbor.Decode(builder, bytes.NewReader(data)); err != nil {
		return nil, err
	}
	return builder.Build(), nil
}

// ipldNodeToJSON serializes an IPLD node to JSON, preserving the node's key iteration order.
func ipldNodeToJSON(node datamodel.Node) ([]byte, error) {
	var buf bytes.Buffer
	if err := writeIPLDJSON(&buf, node); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func writeIPLDJSON(buf *bytes.Buffer, node datamodel.Node) error {
	switch node.Kind() {
	case datamodel.Kind_Null:
		buf.WriteString("null")
	case datamodel.Kind_Bool:
		v, _ := node.AsBool()
		if v {
			buf.WriteString("true")
		} else {
			buf.WriteString("false")
		}
	case datamodel.Kind_Int:
		v, _ := node.AsInt()
		buf.WriteString(strconv.FormatInt(v, 10))
	case datamodel.Kind_Float:
		v, _ := node.AsFloat()
		buf.WriteString(strconv.FormatFloat(v, 'f', -1, 64))
	case datamodel.Kind_String:
		v, _ := node.AsString()
		b, _ := json.Marshal(v)
		buf.Write(b)
	case datamodel.Kind_List:
		buf.WriteByte('[')
		iter := node.ListIterator()
		first := true
		for !iter.Done() {
			_, val, err := iter.Next()
			if err != nil {
				return err
			}
			if !first {
				buf.WriteByte(',')
			}
			first = false
			if err := writeIPLDJSON(buf, val); err != nil {
				return err
			}
		}
		buf.WriteByte(']')
	case datamodel.Kind_Map:
		buf.WriteByte('{')
		iter := node.MapIterator()
		first := true
		for !iter.Done() {
			key, val, err := iter.Next()
			if err != nil {
				return err
			}
			if !first {
				buf.WriteByte(',')
			}
			first = false
			k, _ := key.AsString()
			kb, _ := json.Marshal(k)
			buf.Write(kb)
			buf.WriteByte(':')
			if err := writeIPLDJSON(buf, val); err != nil {
				return err
			}
		}
		buf.WriteByte('}')
	default:
		return fmt.Errorf("unsupported IPLD kind: %v", node.Kind())
	}
	return nil
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
