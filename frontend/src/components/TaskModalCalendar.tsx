import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type Props = {
  selected: Date;
  onChange: (date: Date | null) => void;
  onClickOutside: () => void;
};

/** Code-split: keeps `react-datepicker` + CSS out of the main modal chunk until the calendar opens. */
export default function TaskModalCalendar({ selected, onChange, onClickOutside }: Props) {
  return (
    <DatePicker selected={selected} onChange={onChange} onClickOutside={onClickOutside} inline />
  );
}
