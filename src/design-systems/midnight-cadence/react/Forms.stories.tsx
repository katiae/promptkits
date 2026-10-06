import type { Meta, StoryObj } from "@storybook/react";
import "../tokens/tokens.css";
import "../dist/halyard.css";
import "../dist/forms.css";
import { Checkbox, Radio, Switch, Select, DatePicker } from "./Forms";

const meta: Meta = { title: "Halyard/Forms", parameters: { backgrounds: { default: "dark" } } };
export default meta;

export const Checkboxes: StoryObj = {
  render: () => (<div style={{ display: "grid", gap: 12 }}><Checkbox label="Email me updates" defaultChecked /><Checkbox label="Include archived" /><Checkbox label="Disabled" disabled /></div>),
};
export const Radios: StoryObj = {
  render: () => (<div style={{ display: "grid", gap: 12 }}><Radio name="c" label="Weekly" defaultChecked /><Radio name="c" label="Every two weeks" /><Radio name="c" label="Monthly" /></div>),
};
export const Switches: StoryObj = { render: () => <Switch label="Auto-assign issues" defaultChecked /> };
export const Selects: StoryObj = {
  render: () => (<div style={{ width: 260 }}><Select label="Cycle length" defaultValue="2"><option value="1">1 week</option><option value="2">2 weeks</option><option value="3">3 weeks</option></Select></div>),
};
export const Calendar: StoryObj = { render: () => <DatePicker /> };
