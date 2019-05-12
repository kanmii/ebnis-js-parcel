import React, { useEffect, useState } from "react";
import { Form, Input, Button, TextArea } from "semantic-ui-react";
import dateFnFormat from "date-fns/format";
import { NavigateFn } from "@reach/router";

import "./styles.scss";
import { Props, FieldComponentProps, FormObj, FormObjVal } from "./utils";
import { setTitle, makeExperienceRoute } from "../../routes";
import Loading from "../Loading";
import { FieldType } from "../../graphql/apollo-types/globalTypes";
import DateField from "../DateField";
import DateTimeField from "../DateTimeField";
import { GET_EXP_ENTRIES_QUERY } from "../../graphql/exp-entries.query";
import {
  GetAnExp_exp_fieldDefs,
  GetAnExp_exp
} from "../../graphql/apollo-types/GetAnExp";
import {
  GetExpAllEntries,
  GetExpAllEntriesVariables
} from "../../graphql/apollo-types/GetExpAllEntries";

const fieldTypeUtils = {
  [FieldType.SINGLE_LINE_TEXT]: {
    component(props: FieldComponentProps) {
      return <Input id={props.name} name={props.name} fluid={true} />;
    },
    default: "",
    toString(text: string) {
      return text;
    }
  },

  [FieldType.MULTI_LINE_TEXT]: {
    component(props: FieldComponentProps) {
      return <TextArea id={props.name} name={props.name} />;
    },

    default: "",
    toString(text: string) {
      return text;
    }
  },

  [FieldType.DATE]: {
    component({ value, ...props }: FieldComponentProps) {
      return (
        <DateField value={value as Date} {...props} className="light-border" />
      );
    },

    default: new Date(),

    toString(date: Date) {
      return dateFnFormat(date, "YYYY-MM-DD");
    }
  },

  [FieldType.DATETIME]: {
    component({ value, ...props }: FieldComponentProps) {
      return (
        <DateTimeField
          value={value as Date}
          {...props}
          className="light-border"
        />
      );
    },

    default: new Date(),

    toString(date: Date) {
      return date.toJSON();
    }
  },

  [FieldType.DECIMAL]: {
    component({ name, value, setValue }: FieldComponentProps) {
      return (
        <Input
          type="number"
          id={name}
          name={name}
          value={value}
          fluid={true}
          onChange={e => {
            setValue(name, Number(e.target.value) as any);
          }}
        />
      );
    },

    default: "",

    toString(val: number) {
      return val + "";
    }
  },

  [FieldType.INTEGER]: {
    component({ name, value, setValue }: FieldComponentProps) {
      return (
        <Input
          type="number"
          id={name}
          name={name}
          value={value}
          fluid={true}
          onChange={e => {
            setValue(name, Number(e.target.value) as any);
          }}
        />
      );
    },

    default: "",

    toString(val: number) {
      return val + "";
    }
  }
};

export const NewEntry = (props: Props) => {
  const {
    getExperienceGql: { loading, exp },
    navigate,
    createEntry,
    SidebarHeader
  } = props;
  const [formValues, setFormValues] = useState<FormObj>({} as FormObj);

  useEffect(
    function setRouteTitle() {
      setTitle(pageTitle(exp));

      return setTitle;
    },
    [exp]
  );

  useEffect(
    function setInitialFormValues() {
      if (!exp) {
        return;
      }

      const { fieldDefs } = exp;

      if (!(fieldDefs && fieldDefs.length)) {
        return;
      }

      const initialFormValues = fieldDefs.reduce(function fieldDefReducer(
        acc,
        field,
        index
      ) {
        if (!field) {
          return acc;
        }

        acc[index] = fieldTypeUtils[field.type].default;
        return acc;
      },
      {});

      setFormValues(initialFormValues);
    },
    [exp]
  );

  function setValue(fieldName: string, value: FormObjVal) {
    const fieldIndex = getIndexFromFieldName(fieldName);

    if (fieldIndex === undefined) {
      return;
    }

    setFormValues({ ...formValues, [fieldIndex]: value });
  }

  function getFieldName(index: number) {
    return `fields[${index}]`;
  }

  function getIndexFromFieldName(fieldName: string) {
    const exec = /fields.+(\d+)/.exec(fieldName);

    if (!exec) {
      return undefined;
    }

    return exec[1];
  }

  function goToExp() {
    (navigate as NavigateFn)(makeExperienceRoute((exp && exp.id) || ""));
  }

  async function submit() {
    if (!(exp && createEntry)) {
      return;
    }

    const fields = [];
    const { fieldDefs } = exp;

    for (const [index, val] of Object.entries(formValues)) {
      const index1 = Number(index);
      const field = fieldDefs[index1];

      if (!field) {
        continue;
      }

      const { type, id } = field;
      const toString = fieldTypeUtils[type].toString as any;

      fields.push({
        defId: id,
        data: JSON.stringify({ [type.toLowerCase()]: toString(val) })
      });
    }

    const { id: expId } = exp;

    const variables = {
      entry: {
        expId,
        fields
      }
    };

    await createEntry({
      variables,
      async update(client, { data: newEntry }) {
        if (!newEntry) {
          return;
        }

        const { entry } = newEntry;

        if (!entry) {
          return;
        }

        const variables = {
          entry: { expId }
        };

        const data = client.readQuery<
          GetExpAllEntries,
          GetExpAllEntriesVariables
        >({
          query: GET_EXP_ENTRIES_QUERY,
          variables
        });

        if (!data) {
          return;
        }

        await client.writeQuery({
          query: GET_EXP_ENTRIES_QUERY,
          variables,
          data: {
            expEntries: [...(data.expEntries || []), entry]
          }
        });
      }
    });

    goToExp();
  }

  function renderField(field: GetAnExp_exp_fieldDefs | null, index: number) {
    if (!field) {
      return null;
    }

    const { name: fieldName, type } = field;
    const name = getFieldName(index);
    const utils = fieldTypeUtils[type];

    return (
      <Form.Field key={index}>
        <label htmlFor={fieldName}>{fieldName}</label>

        {utils.component({
          name,
          setValue,
          value: formValues[index] || (utils.default as any)
        })}
      </Form.Field>
    );
  }

  function renderMainOr() {
    if (loading) {
      return <Loading />;
    }

    if (!exp) {
      return <Loading />;
    }

    const { fieldDefs, title } = exp;

    return (
      <div className="main">
        <Button type="button" onClick={goToExp} className="title" basic={true}>
          {title}
        </Button>
        <Form>
          {fieldDefs.map(renderField)}

          <Button
            className="submit-btn"
            type="submit"
            inverted={true}
            color="green"
            fluid={true}
            onClick={submit}
          >
            Submit
          </Button>
        </Form>
      </div>
    );
  }

  return (
    <div className="component-new-entry">
      <SidebarHeader title={pageTitle(exp)} sidebar={true} />

      {renderMainOr()}
    </div>
  );
};

function pageTitle(exp: GetAnExp_exp | null | undefined) {
  return "New " + ((exp && exp.title) || "entry");
}