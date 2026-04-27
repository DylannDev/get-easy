"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOption, updateOption } from "@/actions/admin/options";
import type { Option } from "@/domain/option";
import { optionSchema, type OptionFormValues } from "./option-schema";

interface Args {
  option: Option | null;
  open: boolean;
  onSaved: () => void;
}

const EMPTY: OptionFormValues = {
  name: "",
  description: "",
  priceType: "per_day",
  price: 0,
  maxQuantity: 1,
  sortOrder: 0,
  active: true,
  capEnabled: false,
  monthlyCap: null,
};

function fromOption(option: Option | null): OptionFormValues {
  if (!option) return EMPTY;
  return {
    name: option.name,
    description: option.description ?? "",
    priceType: option.priceType,
    price: option.price,
    maxQuantity: option.maxQuantity,
    sortOrder: option.sortOrder,
    active: option.active,
    capEnabled: option.capEnabled,
    monthlyCap: option.monthlyCap ?? null,
  };
}

/**
 * Encapsule la gestion du formulaire option : `useForm` + reset à chaque
 * ouverture/changement de l'option édité + soumission via `createOption`
 * ou `updateOption`. Renvoie aussi `saving` pour l'état du bouton.
 */
export function useOptionForm({ option, open, onSaved }: Args) {
  const [saving, setSaving] = useState(false);
  const form = useForm<OptionFormValues>({
    resolver: zodResolver(optionSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) form.reset(fromOption(option));
  }, [open, option, form]);

  const submit = form.handleSubmit(async (data) => {
    setSaving(true);
    // Le plafond ne fait sens qu'en per_day : on force reset sinon.
    const capPayload =
      data.priceType === "per_day" &&
      data.capEnabled &&
      data.monthlyCap != null
        ? { capEnabled: true, monthlyCap: data.monthlyCap }
        : { capEnabled: false, monthlyCap: null };
    const payload = {
      name: data.name,
      description: data.description || null,
      priceType: data.priceType,
      price: data.price,
      maxQuantity: data.maxQuantity,
      sortOrder: data.sortOrder,
      active: data.active,
      ...capPayload,
    };
    if (option) {
      await updateOption(option.id, payload);
    } else {
      await createOption(payload);
    }
    setSaving(false);
    form.reset();
    onSaved();
  });

  return { form, saving, submit };
}
