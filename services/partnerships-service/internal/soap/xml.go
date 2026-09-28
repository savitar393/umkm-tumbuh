package soap

import (
	"bytes"
	"encoding/xml"
	"fmt"
	"io"
	"strings"
)

// validateEnvelope menolak dokumen ambigu sebelum operasi bisnis dijalankan.
func validateEnvelope(data []byte, action string) error {
	d := xml.NewDecoder(bytes.NewReader(data))
	var stack []xml.Name
	roots, bodies, operations := 0, 0, 0
	fields := map[string]bool{}
	operation := ""
	for {
		token, err := d.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
		switch t := token.(type) {
		case xml.StartElement:
			depth := len(stack)
			switch depth {
			case 0:
				roots++
				if roots != 1 || t.Name != (xml.Name{Space: NSEnvelope, Local: "Envelope"}) {
					return fmt.Errorf("invalid envelope")
				}
			case 1:
				if t.Name.Space != NSEnvelope || (t.Name.Local != "Body" && t.Name.Local != "Header") {
					return fmt.Errorf("invalid envelope child")
				}
				if t.Name.Local == "Body" {
					bodies++
				}
			case 2:
				if stack[1].Local == "Body" {
					operations++
					operation = t.Name.Local
					if operations != 1 || t.Name.Space != NSPartner {
						return fmt.Errorf("invalid operation")
					}
				}
			case 3:
				if stack[1].Local == "Body" {
					if t.Name.Space != "" || fields[t.Name.Local] {
						return fmt.Errorf("invalid or repeated field")
					}
					fields[t.Name.Local] = true
				}
			default:
				if stack[1].Local == "Body" {
					return fmt.Errorf("nested scalar field")
				}
			}
			stack = append(stack, t.Name)
		case xml.EndElement:
			stack = stack[:len(stack)-1]
		case xml.CharData:
			if (len(stack) < 2 || (stack[1].Local == "Body" && len(stack) < 4)) && strings.TrimSpace(string(t)) != "" {
				return fmt.Errorf("unexpected text")
			}
		case xml.Directive:
			return fmt.Errorf("XML directives are not supported")
		}
	}
	if roots != 1 || bodies != 1 || operations != 1 {
		return fmt.Errorf("missing or repeated body")
	}
	action = strings.Trim(action, "\"")
	if action != "" && action != NSPartner+"/"+operation && action != operation {
		return fmt.Errorf("SOAPAction does not match body")
	}
	return nil
}
